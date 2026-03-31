import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Cleanup orphan photos from storage.
 * Finds photos in the 'photos' bucket that are not referenced
 * by any user_profiles.photos array or primary_photo field.
 * 
 * Should be run on a cron schedule (e.g., daily).
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // List all files in the photos bucket
    const { data: files, error: listError } = await supabase.storage
      .from('photos')
      .list('', { limit: 1000, sortBy: { column: 'created_at', order: 'asc' } });

    if (listError) throw listError;
    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ cleaned: 0, message: 'No files found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all referenced photo URLs from profiles
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('photos,primary_photo');

    if (profileError) throw profileError;

    // Build a set of all referenced filenames
    const referencedFiles = new Set<string>();
    const bucketBaseUrl = `${supabaseUrl}/storage/v1/object/public/photos/`;

    (profiles || []).forEach(p => {
      // Extract filename from full URL
      const extractName = (url: string) => {
        if (!url) return;
        const name = url.replace(bucketBaseUrl, '').split('?')[0];
        if (name) {
          referencedFiles.add(name);
          // Also keep thumbnails
          referencedFiles.add(`thumb_${name}`);
        }
      };

      if (p.primary_photo) extractName(p.primary_photo);
      if (Array.isArray(p.photos)) {
        p.photos.forEach((photo: string) => extractName(photo));
      }
    });

    // Find orphans: files older than 24 hours that aren't referenced
    const oneDayAgo = new Date(Date.now() - 86400000);
    const orphans = files.filter(f => {
      if (!f.name || f.name.startsWith('.')) return false;
      const fileDate = new Date(f.created_at);
      if (fileDate > oneDayAgo) return false; // Keep recent files (user may still be uploading)
      return !referencedFiles.has(f.name);
    });

    if (orphans.length === 0) {
      return new Response(JSON.stringify({ cleaned: 0, message: 'No orphans found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete orphans in batches of 100
    const orphanNames = orphans.map(f => f.name);
    let deleted = 0;
    for (let i = 0; i < orphanNames.length; i += 100) {
      const batch = orphanNames.slice(i, i + 100);
      const { error: deleteError } = await supabase.storage.from('photos').remove(batch);
      if (!deleteError) deleted += batch.length;
      else console.error('Delete batch error:', deleteError);
    }

    console.log(`Cleaned ${deleted} orphan photos out of ${orphanNames.length} candidates`);

    return new Response(JSON.stringify({ cleaned: deleted, total_orphans: orphanNames.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
