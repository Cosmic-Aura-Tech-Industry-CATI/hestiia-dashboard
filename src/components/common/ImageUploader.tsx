import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { adminApi } from '../../services/adminApi';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label = 'Item Photograph',
  helperText = 'Upload high-resolution dish or ambience photo (PNG, JPG, WEBP, max 5MB)',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB limit.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      const res = await adminApi.uploadImage(file);
      if (res.success && res.url) {
        onChange(res.url);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Image upload failed. You can also specify an image URL directly.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-beige">{label}</label>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 rounded-2xl bg-charcoal border border-charcoal-border">
        {/* Preview thumbnail */}
        <div className="relative w-24 h-24 rounded-xl bg-charcoal-surface border border-charcoal-border overflow-hidden flex-shrink-0 flex items-center justify-center">
          {value ? (
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-beige-muted flex flex-col items-center">
              <ImageIcon className="w-6 h-6 mb-1 opacity-60" />
              <span className="text-[10px]">No Image</span>
            </div>
          )}
        </div>

        {/* Upload controls */}
        <div className="flex-1 w-full space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/jpg, image/avif"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl bg-charcoal-card hover:bg-charcoal border border-gold/30 hover:border-gold text-gold hover:text-gold-light text-xs font-semibold flex items-center space-x-1.5 transition-all"
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
          </div>

          <div>
            <input
              type="text"
              placeholder="Or paste image URL (e.g. /images/dishes/handi-paneer.jpg)"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-charcoal-surface border border-charcoal-border text-warmwhite placeholder-beige-muted focus:border-gold/60 focus:outline-none"
            />
          </div>

          {uploadError ? (
            <p className="text-[11px] text-rose-400 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{uploadError}</span>
            </p>
          ) : (
            <p className="text-[10px] text-beige-muted">{helperText}</p>
          )}
        </div>
      </div>
    </div>
  );
};
