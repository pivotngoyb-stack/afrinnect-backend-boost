import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, jsonSchema, addContext, fileUrls } = await req.json();

    // Use Lovable AI gateway instead of direct OpenAI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const messages: any[] = [];

    messages.push({
      role: 'system',
      content: 'You are a helpful assistant for a dating app called Afrinnect. Be friendly, supportive, and culturally aware of African and diaspora communities.'
    });

    if (addContext) {
      messages.push({
        role: 'system',
        content: 'Note: The user requested internet context. Provide current, accurate information.'
      });
    }

    if (fileUrls && fileUrls.length > 0) {
      const content: any[] = [{ type: 'text', text: prompt }];
      for (const url of fileUrls) {
        content.push({ type: 'image_url', image_url: { url } });
      }
      messages.push({ role: 'user', content });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    const useVision = fileUrls && fileUrls.length > 0;
    const model = useVision ? 'google/gemini-2.5-flash' : 'google/gemini-2.5-flash-lite';

    const body: any = {
      model,
      messages,
      max_tokens: 2000,
    };

    if (jsonSchema) {
      body.response_format = { type: 'json_object' };
      messages[messages.length - 1] = {
        role: 'user',
        content: `${prompt}\n\nRespond with a JSON object matching this schema: ${JSON.stringify(jsonSchema)}`
      };
    }

    const response = await fetch('https://ai-gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const result = jsonSchema ? JSON.parse(content || '{}') : content;

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI chat error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
