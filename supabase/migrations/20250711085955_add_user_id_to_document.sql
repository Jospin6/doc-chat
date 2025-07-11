alter table document
add column user_id uuid references auth.users(id) on delete cascade;

create index idx_document_user on document(user_id);

-- Puis recrée ou remplace la fonction avec le paramètre user_id
create or replace function match_document(
  query_embedding vector(384),
  match_count int,
  p_user_id uuid
)
returns table (
  id uuid,
  user_id uuid,
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
    user_id,
    content,
    embedding,
    metadata,
    created_at,
    embedding <-> query_embedding as distance
  from document
  where user_id = p_user_id
  order by distance
  limit match_count;
end;
$$ language plpgsql stable security definer;
