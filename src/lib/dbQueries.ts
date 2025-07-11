import { supabase } from "@/integrations/supabase/client";

// ✅ Fonction pour récupérer les documents d'un utilisateur
export const getUserDocuments = async (userId: string) => {
  const { data, error } = await supabase
    .from("document")
    .select("*")
    .eq("metadata->>user_id", userId) // <- important : extraction de user_id depuis metadata JSONB

  if (error) {
    console.error("Erreur récupération documents:", error);
    return [];
  }

  return data;
};
