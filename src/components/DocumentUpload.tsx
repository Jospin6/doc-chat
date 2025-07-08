
import { useState, useCallback } from 'react';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface DocumentUploadProps {
  onUpload: (files: File[]) => void;
}

export const DocumentUpload = ({ onUpload }: DocumentUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Array<{
    file: File;
    progress: number;
    status: 'uploading' | 'processing' | 'complete' | 'error';
  }>>([]);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf'
    );
    
    if (files.length === 0) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF files only",
        variant: "destructive"
      });
      return;
    }
    
    handleFiles(files);
  }, [toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);

  const handleFiles = (files: File[]) => {
    const newUploads = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));
    
    setUploadingFiles(prev => [...prev, ...newUploads]);
    
    // Simulate upload process
    newUploads.forEach((upload, index) => {
      simulateUpload(upload.file, index);
    });
    
    onUpload(files);
  };

  const simulateUpload = (file: File, index: number) => {
    const interval = setInterval(() => {
      setUploadingFiles(prev => {
        const updated = [...prev];
        const uploadIndex = updated.findIndex(u => u.file === file);
        
        if (uploadIndex === -1) return prev;
        
        const upload = updated[uploadIndex];
        
        if (upload.progress < 70) {
          upload.progress += Math.random() * 20;
          upload.status = 'uploading';
        } else if (upload.progress < 100) {
          upload.progress = 100;
          upload.status = 'processing';
        } else {
          upload.status = 'complete';
          clearInterval(interval);
          
          toast({
            title: "Document uploaded successfully",
            description: `${file.name} is ready for chat`,
          });
        }
        
        return updated;
      });
    }, 500);
  };

  const removeUpload = (file: File) => {
    setUploadingFiles(prev => prev.filter(u => u.file !== file));
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-muted-foreground hover:border-primary hover:bg-muted/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag and drop PDF files here, or
        </p>
        <label htmlFor="file-upload">
          <Button variant="outline" size="sm" asChild>
            <span className="cursor-pointer">Browse Files</span>
          </Button>
        </label>
        <input
          id="file-upload"
          type="file"
          multiple
          accept=".pdf"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((upload, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 border rounded">
              <File className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{upload.file.name}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Progress value={upload.progress} className="flex-1" />
                  <span className="text-xs text-muted-foreground">
                    {upload.status === 'uploading' && `${Math.round(upload.progress)}%`}
                    {upload.status === 'processing' && 'Processing...'}
                    {upload.status === 'complete' && 'Complete'}
                    {upload.status === 'error' && 'Error'}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeUpload(upload.file)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
