create table if not exists document (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(384) not null,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc', now())
);

CREATE INDEX idx_document_embedding ON document USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);