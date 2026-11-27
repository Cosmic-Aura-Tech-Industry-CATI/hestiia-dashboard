'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, CheckCircle2, AlertCircle, Trash2, Cloud, HardDrive } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { ProcessedUploadResult } from '../../types';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  helperText?: string;
  onUploadComplete?: (result: ProcessedUploadResult) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  folder,
  label = 'Item Photograph',
  helperText = 'Drag & drop or choose file (PNG, JPG, WEBP, max 5MB)',
  onUploadComplete,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadMeta, setUploadMeta] = useState<ProcessedUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB limit.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      const res = await adminApi.uploadImage(file, folder);
      if (res.success && res.url) {
        onChange(res.url);
        setUploadMeta(res);
        onUploadComplete?.(res);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Image upload failed. You can also specify an image URL directly.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleClear = async () => {
    const targetToDelete = uploadMeta?.publicId || uploadMeta?.filename;
    onChange('');
    setUploadMeta(null);
    setUploadError(null);
    if (targetToDelete) {
      adminApi.deleteUploadedFile(targetToDelete).catch(() => {});
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-beige">{label}</label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 rounded-2xl bg-charcoal border transition-colors ${
          isDragging ? 'border-gold bg-gold/5' : 'border-charcoal-border'
        }`}
      >
        {/* Preview thumbnail */}
        <div className="relative w-24 h-24 rounded-xl bg-charcoal-card border border-charcoal-border overflow-hidden flex-shrink-0 flex items-center justify-center">
          {value ? (
            <>
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={handleClear}
                title="Remove image"
                className="absolute top-1 right-1 p-1 rounded-lg bg-charcoal-950/80 text-rose-400 hover:text-rose-300 border border-rose-500/30 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          ) : (
            <div className="text-beige-muted flex flex-col items-center">
              <ImageIcon className="w-6 h-6 mb-1 opacity-60" />
              <span className="text-[10px]">No Image</span>
            </div>
          )}
        </div>

        {/* Upload controls */}
        <div className="flex-1 w-full space-y-2 min-w-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/jpg, image/avif"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl bg-charcoal-card hover:bg-charcoal border border-gold/30 hover:border-gold text-gold hover:text-gold-light text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isUploading ? 'Uploading...' : 'Choose File'}</span>
            </button>

            {value && (
              <span className="text-[11px] text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Image Attached</span>
              </span>
            )}

            {uploadMeta && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-charcoal-card border border-charcoal-border text-[10px] text-beige">
                {uploadMeta.provider === 'cloudinary' ? (
                  <Cloud className="w-3 h-3 text-sky-400" />
                ) : (
                  <HardDrive className="w-3 h-3 text-gold" />
                )}
                <span>
                  {uploadMeta.provider === 'cloudinary' ? 'Cloudinary' : 'Local'} •{' '}
                  {Math.max(1, Math.round((uploadMeta.size || 0) / 1024))} KB
                  {uploadMeta.width && uploadMeta.height ? ` (${uploadMeta.width}×${uploadMeta.height})` : ''}
                </span>
              </span>
            )}
          </div>

          <div>
            <input
              type="text"
              placeholder="Or paste image URL (e.g. /images/dishes/handi-paneer.jpg)"
              value={value}
              onChange={(e) => {
                setUploadMeta(null);
                onChange(e.target.value);
              }}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-charcoal-card border border-charcoal-border text-warmwhite placeholder-beige-muted focus:border-gold/60 focus:outline-none"
            />
          </div>

          <p className="text-[10px] text-beige-muted">{helperText}</p>

          {uploadError && (
            <div className="flex items-center space-x-1.5 text-[11px] text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
