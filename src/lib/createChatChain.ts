import { ChatGroq } from "@langchain/groq";
import { createClient } from "@supabase/supabase-js";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { supabase } from "@/integrations/supabase/client";

export const createChatChain = async (userId: string, selectedDocumentIds: string[]) => {
  const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: import.meta.env.VITE_APP_HUGGINGFACE_API_KEY!,
    model: "sentence-transformers/all-MiniLM-L6-v2",
  });

  const vectorstore = await SupabaseVectorStore.fromExistingIndex(embeddings, {
    client: supabase,
    tableName: "document",
    queryName: "match_document",
  });

  const results = await vectorstore.similaritySearch("test query", 3);

  // Filtrage des documents sélectionnés par l'utilisateur
  const filteredRetriever = vectorstore.asRetriever({
  k: 3,
  filter: {
    user_id: userId,
    ids: selectedDocumentIds,
  },
  });

  const model = new ChatGroq({
    apiKey: import.meta.env.VITE_APP_GROQ_API_KEY!,
    model: "llama3-70b-8192",
  });

  const prompt = ChatPromptTemplate.fromMessages([
  ["system", `You are an expert assistant. Use the following context to answer the user's question:\n\n{context}`],
  new MessagesPlaceholder("chat_history"),
  ["user", "{input}"],
]);

  const combineDocsChain = await createStuffDocumentsChain({
    llm: model,
    prompt,
  });

  const retrieverPrompt = ChatPromptTemplate.fromMessages([
    new MessagesPlaceholder("chat_history"),
    ["user", "{input}"],
    ["user", "Based on this conversation, generate a relevant search query."],
  ]);

  const historyAwareRetriever = await createHistoryAwareRetriever({
    llm: model,
    retriever: filteredRetriever,
    rephrasePrompt: retrieverPrompt,
  });

  const chatChain = await createRetrievalChain({
    retriever: historyAwareRetriever,
    combineDocsChain,
  });

  return chatChain;
};
