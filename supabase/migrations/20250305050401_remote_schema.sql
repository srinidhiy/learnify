create extension if not exists "vector" with schema "public" version '0.8.0';

alter table "public"."documents" add column "embedding" vector(1536);

alter table "public"."notes" add column "embedding" vector(1536);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.match_documents(query_embedding vector, match_threshold double precision, match_count integer)
 RETURNS TABLE(id uuid, content text, similarity double precision)
 LANGUAGE sql
 STABLE
AS $function$
  select
    id,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from documents
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$function$
;


