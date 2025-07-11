-- Enable pgvector extension
create extension if not exists vector with schema public;

create or replace function match_document(
  query_embedding vector(384),
  match_count int
)
returns table (
  id uuid,
  content text,
  embedding vector(384),
  metadata jsonb,
  created_at timestamp with time zone,
  distance float
) as $$
begin
  return query
  select
    id,
    content,
    embedding,
    metadata,
    created_at,
    embedding <-> query_embedding as distance
  from document
  order by distance
  limit match_count;
end;
$$ language plpgsql stable security definer;
