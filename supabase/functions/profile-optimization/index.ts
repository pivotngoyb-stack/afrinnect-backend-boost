import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { profile } = await req.json();
    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile data required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Analyze this dating profile from the Afrinnect app (focused on African and diaspora communities) and provide specific optimization tips.

Profile:
- Name: ${profile.display_name || 'Not set'}
- Bio: ${profile.bio || 'No bio'}
- Photos: ${profile.photos?.length || 0} photos
- Interests: ${(profile.interests || []).join(', ') || 'None listed'}
- Prompts: ${profile.prompts?.length || 0} prompts answered
- Education: ${profile.education || 'Not specified'}
- Profession: ${profile.profession || 'Not specified'}
- Location: ${profile.city || profile.country || 'Not specified'}

Provide a thorough analysis. Consider cultural relevance for African/diaspora dating.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: 'You are a dating profile optimization expert. Always respond with valid JSON.' },
          { role: 'user', content: prompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'profile_analysis',
            description: 'Return a structured profile analysis',
            parameters: {
              type: 'object',
              properties: {
                overall_score: { type: 'number', description: 'Score from 0-100' },
                strengths: { type: 'array', items: { type: 'string' }, description: '2-4 profile strengths' },
                improvements: { type: 'array', items: { type: 'string' }, description: '2-4 areas to improve' },
                specific_tips: { type: 'array', items: { type: 'string' }, description: '3-5 actionable tips' },
              },
              required: ['overall_score', 'strengths', 'improvements', 'specific_tips'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'profile_analysis' } },
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI service temporarily unavailable.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    let analysis;
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      analysis = JSON.parse(toolCall.function.arguments);
    } else {
      const content = data.choices?.[0]?.message?.content || '{}';
      analysis = JSON.parse(content);
    }

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Profile optimization error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
