import { ChatGroq } from "@langchain/groq";
import { createClient } from "@supabase/supabase-js";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const createChatChain = async (userId: string, selectedDocumentIds: string[]) => {
  const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HUGGINGFACE_API_KEY!,
    model: "sentence-transformers/all-MiniLM-L6-v2",
  });

  const vectorstore = await SupabaseVectorStore.fromExistingIndex(embeddings, {
    client: supabase,
    tableName: "document",
    queryName: "match_document",
  });

  // Filtrage des documents sélectionnés par l'utilisateur
  const filteredRetriever = vectorstore.asRetriever({
    k: 3,
    filter: (metadata) => {
      return (
        metadata.user_id === userId &&
        selectedDocumentIds.includes(metadata.id)
      );
    },
  });

  const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY!,
    model: "llama-3-70b-8192",
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "Réponds aux questions de l'utilisateur à partir des documents sélectionnés : {context}"],
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
    ["user", "Sur la base de cette conversation, génère une requête de recherche pertinente."],
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
