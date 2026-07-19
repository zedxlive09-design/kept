'use client';

import { useRef, useState, useCallback } from 'react';
import { Camera, Pencil, ImageIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ItemForm } from '@/components/items/ItemForm';
import { AIReviewForm } from '@/components/items/AIReviewForm';

export default function NewItemPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  // Using a key to reset the AIReviewForm when the user starts over
  const [aiKey, setAiKey] = useState(0);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setAiKey((k) => k + 1);

    // Generate preview URL
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
  }, [imagePreviewUrl]);

  const handleStartOver = useCallback(() => {
    setSelectedFile(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(null);
    setAiKey((k) => k + 1);
    // Reset the file input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [imagePreviewUrl]);

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-xl font-semibold mb-6">Add item</h1>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="scan" className="flex-1 gap-2">
            <Camera className="h-4 w-4" />
            Scan
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex-1 gap-2">
            <Pencil className="h-4 w-4" />
            Manual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="mt-6 space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,image/heic"
            className="hidden"
            onChange={handleFileSelect}
          />

          {!selectedFile && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-12 text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
            >
              <ImageIcon className="h-10 w-10" />
              <span className="text-sm">Tap to upload a receipt photo</span>
              <span className="text-xs text-muted-foreground">
                Supports JPEG, PNG, and HEIC
              </span>
            </button>
          )}

          {selectedFile && imagePreviewUrl && (
            <AIReviewForm
              key={aiKey}
              file={selectedFile}
              imagePreviewUrl={imagePreviewUrl}
              onStartOver={handleStartOver}
            />
          )}
        </TabsContent>

        <TabsContent value="manual" className="mt-6">
          <ItemForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}