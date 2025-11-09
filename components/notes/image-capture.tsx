"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X } from "lucide-react";
import Image from "next/image";

interface ImageCaptureProps {
  onImageCapture: (file: File) => void;
}

export function ImageCapture({ onImageCapture }: ImageCaptureProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      onImageCapture(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        setImagePreview(url);
        onImageCapture(file);
        stopCamera();
      }
    }, "image/jpeg");
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {!imagePreview && !showCamera && (
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Image
          </Button>
          <Button type="button" onClick={startCamera} variant="outline">
            <Camera className="mr-2 h-4 w-4" />
            Take Photo
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {showCamera && (
        <div className="space-y-2">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg border"
          />
          <div className="flex gap-2">
            <Button type="button" onClick={capturePhoto}>
              <Camera className="mr-2 h-4 w-4" />
              Capture
            </Button>
            <Button type="button" onClick={stopCamera} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {imagePreview && (
        <div className="relative">
          <Image
            src={imagePreview}
            alt="Captured"
            width={400}
            height={300}
            className="rounded-lg border w-full h-auto"
          />
          <Button
            type="button"
            onClick={removeImage}
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
