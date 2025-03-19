import React, { useState } from 'react';
import { Download, File } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentViewerProps {
  url: string;
  filename: string;
  className?: string;
}

export function DocumentViewer({ url, filename, className }: DocumentViewerProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const isPdf = filename.toLowerCase().endsWith('.pdf');
  const isImage = /\.(jpg|jpeg|png|gif)$/i.test(filename);

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    setError(true);
    setLoading(false);
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700 truncate">{filename}</h3>
        <a
          href={url}
          download={filename}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <Download className="h-4 w-4 mr-1" />
          <span className="text-sm">Download</span>
        </a>
      </div>

      <div className="border rounded-lg overflow-hidden bg-gray-50">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <File className="h-12 w-12 mb-2" />
            <p>Unable to preview this document</p>
            <a
              href={url}
              download={filename}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Download instead
            </a>
          </div>
        )}

        {!error && isPdf && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <File className="h-12 w-12 mb-2" />
            <p>PDF Preview</p>
            <p className="text-sm text-gray-400">PDF preview is available when you download the file</p>
            <a
              href={url}
              download={filename}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Download to view
            </a>
          </div>
        )}

        {!error && isImage && (
          <div className="p-4" style={{ display: loading ? 'none' : 'block' }}>
            <img
              src={url}
              alt={filename}
              className="max-w-full h-auto mx-auto"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </div>
        )}

        {!error && !isPdf && !isImage && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <File className="h-12 w-12 mb-2" />
            <p>Document Preview</p>
            <p className="text-sm text-gray-400">This document type cannot be previewed</p>
            <a
              href={url}
              download={filename}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Download to view
            </a>
          </div>
        )}
      </div>
    </div>
  );
}