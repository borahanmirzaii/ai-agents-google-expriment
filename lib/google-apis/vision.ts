/**
 * Google Cloud Vision API Integration
 *
 * Provides OCR (Optical Character Recognition) capabilities for image notes.
 * Extracts text from images to enhance searchability and AI analysis.
 */

import { ImageAnnotatorClient } from "@google-cloud/vision";

// Initialize Vision API client
let visionClient: ImageAnnotatorClient | null = null;

function getVisionClient() {
  if (!visionClient) {
    // In production, use service account credentials
    // For now, we'll use the default credentials or API key
    const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (credentials) {
      visionClient = new ImageAnnotatorClient({
        keyFilename: credentials,
      });
    } else {
      console.warn("Google Cloud Vision API credentials not configured");
      return null;
    }
  }

  return visionClient;
}

/**
 * Extract text from an image using OCR
 * @param imageUrl - URL or base64 encoded image
 * @returns Extracted text and confidence scores
 */
export async function extractTextFromImage(imageUrl: string): Promise<{
  text: string;
  detectedText: Array<{
    text: string;
    confidence: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }>;
}> {
  const client = getVisionClient();

  if (!client) {
    // Fallback: return empty result if API not configured
    console.warn("Vision API not available, skipping OCR");
    return {
      text: "",
      detectedText: [],
    };
  }

  try {
    // Detect text in the image
    const [result] = await client.textDetection(imageUrl);
    const detections = result.textAnnotations || [];

    if (detections.length === 0) {
      return {
        text: "",
        detectedText: [],
      };
    }

    // The first annotation contains the full text
    const fullText = detections[0]?.description || "";

    // Extract individual text blocks with confidence
    const detectedText = detections.slice(1).map((detection: any) => {
      const vertices = detection.boundingPoly?.vertices || [];

      let boundingBox;
      if (vertices.length >= 2) {
        const x = Math.min(...vertices.map((v: any) => v.x || 0));
        const y = Math.min(...vertices.map((v: any) => v.y || 0));
        const maxX = Math.max(...vertices.map((v: any) => v.x || 0));
        const maxY = Math.max(...vertices.map((v: any) => v.y || 0));

        boundingBox = {
          x,
          y,
          width: maxX - x,
          height: maxY - y,
        };
      }

      return {
        text: detection.description || "",
        confidence: detection.confidence || 0,
        boundingBox,
      };
    });

    return {
      text: fullText,
      detectedText,
    };
  } catch (error) {
    console.error("Error extracting text from image:", error);
    throw new Error("Failed to extract text from image");
  }
}

/**
 * Detect labels/objects in an image
 * @param imageUrl - URL or base64 encoded image
 * @returns Detected labels with confidence scores
 */
export async function detectImageLabels(imageUrl: string): Promise<
  Array<{
    label: string;
    confidence: number;
  }>
> {
  const client = getVisionClient();

  if (!client) {
    console.warn("Vision API not available, skipping label detection");
    return [];
  }

  try {
    const [result] = await client.labelDetection(imageUrl);
    const labels = result.labelAnnotations || [];

    return labels.map((label: any) => ({
      label: label.description || "",
      confidence: label.score || 0,
    }));
  } catch (error) {
    console.error("Error detecting image labels:", error);
    throw new Error("Failed to detect image labels");
  }
}

/**
 * Perform comprehensive image analysis
 * Combines text extraction, label detection, and other Vision API features
 */
export async function analyzeImage(imageUrl: string): Promise<{
  text: string;
  detectedText: Array<{
    text: string;
    confidence: number;
  }>;
  labels: Array<{
    label: string;
    confidence: number;
  }>;
  suggestedTags: string[];
}> {
  const client = getVisionClient();

  if (!client) {
    return {
      text: "",
      detectedText: [],
      labels: [],
      suggestedTags: [],
    };
  }

  try {
    // Run multiple detections in parallel
    const [textResult, labelResult] = await Promise.all([
      extractTextFromImage(imageUrl),
      detectImageLabels(imageUrl),
    ]);

    // Generate suggested tags from high-confidence labels
    const suggestedTags = labelResult
      .filter((label) => label.confidence > 0.7)
      .map((label) => label.label.toLowerCase())
      .slice(0, 5);

    return {
      text: textResult.text,
      detectedText: textResult.detectedText,
      labels: labelResult,
      suggestedTags,
    };
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error("Failed to analyze image");
  }
}
