set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.match_notes(query_embedding vector)
 RETURNS TABLE(id uuid, content text, similarity double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT n.id, n.content, (1 - (n.embedding <=> query_embedding)) AS similarity
    FROM notes n
    ORDER BY similarity DESC
    LIMIT 10;
END;
$function$
;


