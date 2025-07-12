import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const indexDocument = async (text: string, userId: string, sourcePath: string) => {
  const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: import.meta.env.VITE_APP_HUGGINGFACE_API_KEY!,
    model: "sentence-transformers/all-MiniLM-L6-v2",
  });

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const splitDocs = await splitter.splitDocuments([
    new Document({
      pageContent: text,
      metadata: {
        user_id: userId,
        source: sourcePath, // lien dans le bucket Supabase
      },
    }),
  ]);

  await SupabaseVectorStore.fromDocuments(splitDocs, embeddings, {
    client: supabase,
    tableName: "document",
    queryName: "match_document",
  });
};
