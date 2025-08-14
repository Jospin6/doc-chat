import { FileText, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { extractFileName } from '@/lib/utils';

interface Document {
  id: string;
  name: string;
  uploadedAt: string;
  size: number;
  status: 'processing' | 'ready' | 'error';
  chunksCount?: number;
}

interface DocumentListProps {
  documents: Document[];
  selectedDocuments: Document[];
  onToggleSelect: (document: Document) => void;
  onDocumentSelect: (document: Document) => void;
}

export const DocumentList = ({
  documents,
  selectedDocuments,
  onToggleSelect,
  onDocumentSelect,
}: DocumentListProps) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'ready':
        return <Badge variant="default">Ready</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  const isSelected = (doc: Document) =>
    selectedDocuments.some((d) => d.id === doc.id);

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((document) => {
        const selected = isSelected(document);
        return (
          <div
            key={document.id}
            className={`p-3 border rounded-lg cursor-pointer transition-colors ${selected
              ? 'border-primary bg-primary/10'
              : 'hover:bg-muted/50'
              }`}
            onClick={() => {
              if (document.status === 'ready') {
                onToggleSelect(document);
                onDocumentSelect(document);
              }
            }}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">{getStatusIcon(document.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium truncate">{extractFileName(document.name)}</h4>
                  {getStatusBadge(document.status)}
                </div>

                <div className="flex items-center text-xs text-muted-foreground space-x-2">
                  {/* <span>{formatFileSize(document.size)}</span>
                  <span>•</span> */}
                  <span>{document.uploadedAt}</span>
                  {document.chunksCount && (
                    <>
                      <span>•</span>
                      <span>{document.chunksCount} chunks</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {document.status === 'ready' && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(document);
                  onDocumentSelect(document);
                }}
              >
                {selected ? 'Désélectionner' : 'Chat avec ce document'}
              </Button>
            )}

            {document.status === 'processing' && (
              <p className="text-xs text-muted-foreground mt-2">
                Processing document and generating embeddings...
              </p>
            )}

            {document.status === 'error' && (
              <p className="text-xs text-red-500 mt-2">
                Failed to process document. Please try uploading again.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
