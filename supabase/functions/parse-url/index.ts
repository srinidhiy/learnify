
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { JSDOM } from 'npm:jsdom';
import { Readability } from 'npm:@mozilla/readability';
import { HTMLRewriter} from 'npm:htmlrewriter';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const toBeRemovedTags = ['script', 'style', 'noscript', 'iframe']
class ElementHandler {
  element(element) {
      if (toBeRemovedTags.includes(element.tagName)) {
          element.remove()
      }
  }

  comments(comment) {
      comment.remove()
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch the URL content
    const response = await fetch(url);
    const newResponse = new HTMLRewriter().on('*', new ElementHandler()).transform(response)
    const html = await newResponse.text();

    // Parse the HTML content
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      return new Response(
        JSON.stringify({ error: 'Could not parse article content' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const normalizedArticle = article.content.replace(/<\/p>(?=<p)/g, '</p> ');

    const result = {
      title: article.title,
      content: normalizedArticle,
      excerpt: article.excerpt,
      byline: article.byline,
      siteName: article.siteName,
      textContent: article.textContent,
    };

    console.log('Successfully parsed URL:', url);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error parsing URL:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
