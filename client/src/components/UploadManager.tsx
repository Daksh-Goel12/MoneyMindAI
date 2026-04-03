import { useState, useEffect, useRef } from 'react';
import type { UploadedDoc } from '../types';
import { getDocuments, uploadDocument, deleteDocument } from '../api';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadManager() {
  const [uploads, setUploads] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getDocuments()
      .then((data) => setUploads(data.documents))
      .catch(() => {});
  }, []);

  const validateFile = (file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return 'Only PDF files are supported.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Please upload a PDF file under 10MB.';
    }
    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const result = await uploadDocument(file);
      setUploads((prev) => [
        ...prev,
        {
          id: result.documentId,
          name: result.name,
          filename: file.name,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id);
      setUploads((prev) => prev.filter((doc) => doc.id !== id));
    } catch {
      setError('Failed to delete document. Please try again.');
    }
  };

  return (
    <div className="border-t border-[var(--color-border)] pt-4 mt-4">
      <h3 className="text-sm font-semibold text-primary-600 mb-3">Upload PDF</h3>

      <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-primary-300 rounded-lg cursor-pointer hover:bg-primary-50 transition-colors">
        <span className="text-sm text-text-secondary">
          {uploading ? 'Uploading…' : 'Choose a PDF file (max 10MB)'}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {uploading && (
        <div className="mt-2 h-1.5 w-full bg-primary-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary-500 rounded-full animate-pulse w-full" />
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {uploads.length > 0 && (
        <ul className="mt-3 space-y-2">
          {uploads.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between px-3 py-2 bg-surface-secondary rounded-lg border border-[var(--color-border)]"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-text truncate">{doc.name}</p>
                <p className="text-xs text-text-secondary">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(doc.id)}
                className="ml-2 text-xs text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                aria-label={`Delete ${doc.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
