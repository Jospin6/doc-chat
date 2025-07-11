import { useEffect, useState } from "react";
import { getUserDocuments } from "@/lib/dbQueries";
import { DocumentList } from "./DocumentList";

interface SupabaseDoc {
  id: string;
  content: string;
  created_at: string;
  metadata: {
    user_id: string;
    source?: string;
    size?: number;
    name?: string;
  };
  status?: "processing" | "ready" | "error";
  chunksCount?: number;
}

interface DocumentListUI {
  id: string;
  name: string;
  uploadedAt: string;
  size: number;
  status: "processing" | "ready" | "error";
  chunksCount?: number;
}

export const UserDocumentsWrapper = ({
  userId,
  onSelectDocument,
}: {
  userId: string;
  onSelectDocument: (doc: DocumentListUI) => void;
}) => {
  const [documents, setDocuments] = useState<DocumentListUI[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<DocumentListUI[]>([]);

  useEffect(() => {
    const fetchDocs = async () => {
      const docs: SupabaseDoc[] = await getUserDocuments(userId);

      const formatted: DocumentListUI[] = docs.map((doc) => ({
        id: doc.id,
        name: doc.metadata?.name || doc.metadata?.source || "Unnamed Document",
        uploadedAt: new Date(doc.created_at).toLocaleString(),
        size: doc.metadata?.size || 0,
        status: doc.status || "ready",
        chunksCount: doc.chunksCount || undefined,
      }));

      setDocuments(formatted);
    };

    fetchDocs();
  }, [userId]);

  const handleToggleSelect = (doc: DocumentListUI) => {
    setSelectedDocuments((prev) =>
      prev.some((d) => d.id === doc.id)
        ? prev.filter((d) => d.id !== doc.id) // Retirer s'il est déjà sélectionné
        : [...prev, doc] // Ajouter sinon
    );
  };

  return (
    <div className="space-y-4">
      <DocumentList
        documents={documents}
        selectedDocuments={selectedDocuments}
        onDocumentSelect={onSelectDocument}
        onToggleSelect={handleToggleSelect}
      />

      {selectedDocuments.length > 0 && (
        <div className="p-4 border rounded-lg bg-muted">
          <p className="text-sm font-medium mb-2">
            {selectedDocuments.length} document(s) sélectionné(s)
          </p>
          {/* Tu peux ajouter ici un bouton pour lancer le chat avec les documents sélectionnés */}
        </div>
      )}
    </div>
  );
};
