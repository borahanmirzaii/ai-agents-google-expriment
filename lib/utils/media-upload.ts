import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/config";

/**
 * Upload a media file to Firebase Storage
 */
export async function uploadMediaFile(
  userId: string,
  file: File,
  type: "audio" | "image" | "video" | "thumbnail"
): Promise<string> {
  const timestamp = Date.now();
  const fileExtension = file.name.split(".").pop() || "bin";
  const fileName = `${timestamp}.${fileExtension}`;
  const filePath = `users/${userId}/${type}s/${fileName}`;

  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, file);

  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

/**
 * Compress image before upload
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error("Failed to compress image"));
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

/**
 * Generate thumbnail from video
 */
export async function generateVideoThumbnail(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = URL.createObjectURL(file);

    video.onloadeddata = () => {
      video.currentTime = 1; // Get frame at 1 second
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const thumbnailFile = new File([blob], "thumbnail.jpg", {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            URL.revokeObjectURL(video.src);
            resolve(thumbnailFile);
          } else {
            reject(new Error("Failed to generate thumbnail"));
          }
        },
        "image/jpeg",
        0.7
      );
    };

    video.onerror = reject;
  });
}
