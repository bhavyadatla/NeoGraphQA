import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileType } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropzoneProps {
  onDrop: (files: File[]) => void;
  isLoading?: boolean;
  accept?: Record<string, string[]>;
  maxSize?: number; // bytes
}

export function Dropzone({ onDrop, isLoading, accept, maxSize = 10485760 }: DropzoneProps) {
  const handleDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onDrop(acceptedFiles);
    }
  }, [onDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept,
    maxSize,
    disabled: isLoading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 border-dashed border-border p-12 transition-all duration-300 cursor-pointer group",
        isDragActive ? "border-primary bg-primary/5 scale-[0.99]" : "bg-card hover:bg-muted/50 hover:border-primary/50",
        isLoading && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center text-center gap-4">
        <div className={cn(
          "p-4 rounded-full bg-muted transition-colors duration-300",
          isDragActive ? "bg-primary/20 text-primary" : "group-hover:bg-primary/10 group-hover:text-primary"
        )}>
          {isLoading ? (
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <UploadCloud className="w-8 h-8" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold font-display">
            {isDragActive ? "Drop file here" : "Upload Document"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
            Drag & drop PDF, TXT, or CSV files here, or click to select
          </p>
        </div>
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span className="bg-muted px-2 py-1 rounded-md">PDF</span>
          <span className="bg-muted px-2 py-1 rounded-md">TXT</span>
          <span className="bg-muted px-2 py-1 rounded-md">CSV</span>
          <span className="bg-muted px-2 py-1 rounded-md">Max 10MB</span>
        </div>
      </div>
    </div>
  );
}
