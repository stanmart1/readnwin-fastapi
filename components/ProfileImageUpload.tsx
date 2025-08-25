'use client';

import { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ProfileImageUploadProps {
  currentImage?: string;
  onImageUpdate: (imageUrl: string) => void;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function ProfileImageUpload({ currentImage, onImageUpdate }: ProfileImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const onSelectFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerAspectCrop(width, height, 1);
    setCrop(crop);
  }, []);

  const getCroppedImg = useCallback(
    (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = crop.width;
      canvas.height = crop.height;

      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height,
      );

      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            }
          },
          'image/jpeg',
          0.95,
        );
      });
    },
    [],
  );

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) return;

    try {
      setIsUploading(true);
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
      
      // Convert blob to base64 for preview
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        onImageUpdate(base64);
        setPreviewUrl(null);
        setSelectedFile(null);
        setCrop(undefined);
        setCompletedCrop(undefined);
      };
      reader.readAsDataURL(croppedBlob);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onImageUpdate('');
    setPreviewUrl(null);
    setSelectedFile(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Picture
        </label>
        <p className="text-sm text-gray-500 mb-4">
          Upload a profile picture. We recommend a square image for best results.
        </p>
      </div>

      {/* Current Image Display */}
      {currentImage && !previewUrl && (
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img
              src={currentImage}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
            />
            <button
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
              title="Remove image"
            >
              <i className="ri-close-line text-sm"></i>
            </button>
          </div>
          <div>
            <p className="text-sm text-gray-600">Current profile picture</p>
            <button
              onClick={() => document.getElementById('image-upload')?.click()}
              className="text-sm text-blue-600 hover:text-blue-800 mt-1"
            >
              Change image
            </button>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {!currentImage && !previewUrl && (
        <div className="flex justify-center">
          <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center hover:border-gray-400 transition-colors cursor-pointer"
               onClick={() => document.getElementById('image-upload')?.click()}>
            <div className="text-center">
              <i className="ri-camera-line text-2xl text-gray-400 mb-1"></i>
              <p className="text-xs text-gray-500">Upload</p>
            </div>
          </div>
        </div>
      )}

      {/* Image Cropper */}
      {previewUrl && (
        <div className="space-y-4">
          <div className="max-w-md">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={previewUrl}
                onLoad={onImageLoad}
                className="max-w-full h-auto"
              />
            </ReactCrop>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleCropComplete}
              disabled={isUploading || !completedCrop}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <i className="ri-check-line"></i>
                  <span>Apply Crop</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => {
                setPreviewUrl(null);
                setSelectedFile(null);
                setCrop(undefined);
                setCompletedCrop(undefined);
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={onSelectFile}
        className="hidden"
      />
    </div>
  );
} 