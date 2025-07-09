
import { useState } from 'react';
import { Upload, FileText, MessageSquare, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentUpload } from '@/components/DocumentUpload';
import { DocumentList } from '@/components/DocumentList';
import { ChatInterface } from '@/components/ChatInterface';

interface Document {
  id: string;
  name: string;
  uploadedAt: string;
  size: number;
  status: 'processing' | 'ready' | 'error';
  chunksCount?: number;
}

const Dashboard = () => {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'Sample Document.pdf',
      uploadedAt: '2024-01-08',
      size: 1024000,
      status: 'ready',
      chunksCount: 15
    }
  ]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'chat'>('documents');

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
    setActiveTab('chat');
  };

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log('Logout clicked');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">DocChat</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Documents</span>
                </CardTitle>
                <CardDescription>
                  Upload and manage your PDF documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <DocumentUpload 
                    onUpload={(files) => {
                      // TODO: Handle file upload
                      console.log('Files uploaded:', files);
                    }}
                  />
                  <DocumentList 
                    documents={documents}
                    onDocumentSelect={handleDocumentSelect}
                    selectedDocument={selectedDocument}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {selectedDocument ? (
              <Card className="h-[600px]">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>Chat with {selectedDocument.name}</span>
                  </CardTitle>
                  <CardDescription>
                    Ask questions about your document and get AI-powered answers
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ChatInterface document={selectedDocument} />
                </CardContent>
              </Card>
            ) : (
              <Card className="h-[600px] flex items-center justify-center">
                <CardContent className="text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Document Selected</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload a PDF document and select it to start chatting
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
