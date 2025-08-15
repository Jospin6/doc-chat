import { useState, useCallback } from 'react';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import * as pdfjsLib from 'pdfjs-dist';
import { indexDocument } from '@/lib/indexDocument';
import { useAuth } from '@/hooks/useAuth';
import pdfToText from 'react-pdftotext';

interface DocumentUploadProps {
  onUpload: (payload: {
    file: File;
    bucketPath: string;
    extractedText: string;
  }) => void;
}

export const DocumentUpload = ({ onUpload }: DocumentUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const { user } = useAuth()
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
        title: 'Invalid file type',
        description: 'Please upload PDF files only',
        variant: 'destructive',
      });
      return;
    }

    handleFiles(files);
  }, [toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);

  // const handleFiles = async (files: File[]) => {
  //   const newUploads = files.map(file => ({
  //     file,
  //     progress: 0,
  //     status: 'uploading' as const,
  //   }));

  //   setUploadingFiles(prev => [...prev, ...newUploads]);

  //   for (const upload of newUploads) {
  //     await processFile(upload.file);
  //   }
  // };

  const handleFiles = useCallback(async (files: File[]) => {
    // Filtrer les fichiers déjà en cours d'upload
    const existingFiles = uploadingFiles.map(u => u.file.name);
    const newFiles = files.filter(file => !existingFiles.includes(file.name));

    if (newFiles.length === 0) {
      toast({
        title: 'Files already uploading',
        description: 'Some files are already being processed',
        variant: 'default',
      });
      return;
    }

    const newUploads = newFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadingFiles(prev => [...prev, ...newUploads]);

    // Traiter les fichiers en parallèle
    await Promise.all(newFiles.map(file => processFile(file)));
  }, [uploadingFiles, toast]);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const text = await pdfToText(file);
      return text;
    } catch (error) {
      alert("Impossible d'extraire le texte du PDF.");
      return '';
    }
  };

  const processFile = async (file: File) => {
    try {
      // Vérifier si le fichier est déjà dans l'état (au cas où)
      const alreadyUploading = uploadingFiles.some(u => u.file === file);
      if (alreadyUploading) return;

      setUploadingFiles(prev =>
        prev.map(u =>
          u.file === file ? { ...u, status: 'uploading', progress: 10 } : u
        )
      );
      const rawName = `${Date.now()}_${file.name}`;
      const fileName = `flreew_1/${rawName}`;
      console.log("Uploading file to Supabase...");
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          contentType: 'application/pdf',
        });

      // Copier dans le dossier SELECT
      // const copyError = await supabase.storage
      //   .from('documents')
      //   .copy(fileName, `flreew_0/${rawName}`);

      // if (copyError.error) throw copyError.error;

      // // Maintenant tu peux lire depuis `flreew_0/${rawName}`
      // const publicURL = supabase.storage
      //   .from('documents')
      //   .getPublicUrl(`flreew_0/${rawName}`).data.publicUrl;

      if (error) throw new Error("Supabase upload failed: " + error.message);
      const bucketPath = data?.path;
      console.log("Upload réussi:", bucketPath);

      setUploadingFiles(prev =>
        prev.map(u =>
          u.file === file ? { ...u, status: 'processing', progress: 70 } : u
        )
      );

      console.log("Extraction du texte...");
      const extractedText = await extractTextFromPDF(file);
      console.log("Texte extrait");

      console.log("Indexation...");
      await indexDocument(extractedText, user.id, bucketPath);
      console.log("Indexation terminée");

      onUpload({
        file,
        bucketPath: bucketPath!,
        extractedText,
      });

      setUploadingFiles(prev =>
        prev.map(u =>
          u.file === file ? { ...u, status: 'complete', progress: 100 } : u
        )
      );

      toast({
        title: 'Upload réussi',
        description: `${file.name} est prêt à être utilisé`,
      });
    } catch (err) {
      console.error('Erreur pendant l’upload :', err);
      setUploadingFiles(prev =>
        prev.map(u =>
          u.file === file ? { ...u, status: 'error', progress: 0 } : u
        )
      );

      toast({
        title: 'Erreur upload',
        description: `Impossible de traiter ${file.name}`,
        variant: 'destructive',
      });
    }

  };

  const removeUpload = (file: File) => {
    setUploadingFiles(prev => prev.filter(u => u.file !== file));
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging
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
