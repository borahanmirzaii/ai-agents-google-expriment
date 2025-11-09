/**
 * Google Cloud Speech-to-Text API Integration
 *
 * Provides audio transcription capabilities for audio and video notes.
 * Converts speech to text for enhanced searchability and AI analysis.
 */

import { SpeechClient } from "@google-cloud/speech";
import type { protos } from "@google-cloud/speech";
import { storage } from "@/lib/firebase/config";
import { ref, getDownloadURL } from "firebase/storage";

// Initialize Speech-to-Text API client
let speechClient: SpeechClient | null = null;

function getSpeechClient() {
  if (!speechClient) {
    const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (credentials) {
      speechClient = new SpeechClient({
        keyFilename: credentials,
      });
    } else {
      console.warn("Google Cloud Speech-to-Text API credentials not configured");
      return null;
    }
  }

  return speechClient;
}

/**
 * Transcribe audio from a URL
 * @param audioUrl - URL to the audio file
 * @param options - Transcription options
 * @returns Transcribed text with confidence scores
 */
export async function transcribeAudio(
  audioUrl: string,
  options?: {
    languageCode?: string;
    enableAutomaticPunctuation?: boolean;
    enableWordTimeOffsets?: boolean;
  }
): Promise<{
  transcript: string;
  confidence: number;
  words?: Array<{
    word: string;
    startTime: number;
    endTime: number;
    confidence: number;
  }>;
}> {
  const client = getSpeechClient();

  if (!client) {
    console.warn("Speech-to-Text API not available, skipping transcription");
    return {
      transcript: "",
      confidence: 0,
    };
  }

  try {
    // Fetch the audio file
    const fetchResponse = await fetch(audioUrl);
    const audioBuffer = await fetchResponse.arrayBuffer();
    const audioBytes = Buffer.from(audioBuffer).toString("base64");

    // Configure request
    const request: protos.google.cloud.speech.v1.IRecognizeRequest = {
      audio: {
        content: audioBytes,
      },
      config: {
        encoding: "WEBM_OPUS" as unknown as protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding,
        sampleRateHertz: 48000,
        languageCode: options?.languageCode || "en-US",
        enableAutomaticPunctuation: options?.enableAutomaticPunctuation ?? true,
        enableWordTimeOffsets: options?.enableWordTimeOffsets ?? false,
        model: "default",
      },
    };

    // Perform transcription
    const [speechResponse] = await client.recognize(request);
    const transcription = speechResponse.results
      ?.map((result: any) => result.alternatives?.[0]?.transcript)
      .join("\n") || "";

    const confidence = speechResponse.results?.[0]?.alternatives?.[0]?.confidence || 0;

    // Extract word-level timing if requested
    let words;
    if (options?.enableWordTimeOffsets) {
      words = speechResponse.results?.[0]?.alternatives?.[0]?.words?.map((wordInfo: any) => ({
        word: wordInfo.word || "",
        startTime: Number(wordInfo.startTime?.seconds || 0) + (wordInfo.startTime?.nanos || 0) / 1e9,
        endTime: Number(wordInfo.endTime?.seconds || 0) + (wordInfo.endTime?.nanos || 0) / 1e9,
        confidence: wordInfo.confidence || 0,
      }));
    }

    return {
      transcript: transcription,
      confidence,
      words,
    };
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Failed to transcribe audio");
  }
}

/**
 * Transcribe audio with long-running operation for files > 1 minute
 * @param audioUrl - URL to the audio file
 * @param options - Transcription options
 * @returns Transcribed text with confidence scores
 */
export async function transcribeAudioLongRunning(
  audioUrl: string,
  options?: {
    languageCode?: string;
    enableAutomaticPunctuation?: boolean;
    enableWordTimeOffsets?: boolean;
    enableSpeakerDiarization?: boolean;
  }
): Promise<{
  transcript: string;
  confidence: number;
  words?: Array<{
    word: string;
    startTime: number;
    endTime: number;
    confidence: number;
    speakerTag?: number;
  }>;
}> {
  const client = getSpeechClient();

  if (!client) {
    console.warn("Speech-to-Text API not available, skipping transcription");
    return {
      transcript: "",
      confidence: 0,
    };
  }

  try {
    // Configure request for long-running operation
    const request: protos.google.cloud.speech.v1.ILongRunningRecognizeRequest = {
      audio: {
        uri: audioUrl,
      },
      config: {
        encoding: "WEBM_OPUS" as unknown as protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding,
        sampleRateHertz: 48000,
        languageCode: options?.languageCode || "en-US",
        enableAutomaticPunctuation: options?.enableAutomaticPunctuation ?? true,
        enableWordTimeOffsets: options?.enableWordTimeOffsets ?? false,
        model: "default",
        diarizationConfig: options?.enableSpeakerDiarization
          ? {
              enableSpeakerDiarization: true,
              minSpeakerCount: 1,
              maxSpeakerCount: 6,
            }
          : undefined,
      },
    };

    // Start long-running operation
    const [operation] = await client.longRunningRecognize(request);

    // Wait for operation to complete
    const [speechResponse] = await operation.promise();

    const transcription =
      speechResponse.results
        ?.map((result: any) => result.alternatives?.[0]?.transcript)
        .join("\n") || "";

    const confidence = speechResponse.results?.[0]?.alternatives?.[0]?.confidence || 0;

    // Extract word-level timing if requested
    let words;
    if (options?.enableWordTimeOffsets) {
      words = speechResponse.results?.[0]?.alternatives?.[0]?.words?.map((wordInfo: any) => ({
        word: wordInfo.word || "",
        startTime: Number(wordInfo.startTime?.seconds || 0) + (wordInfo.startTime?.nanos || 0) / 1e9,
        endTime: Number(wordInfo.endTime?.seconds || 0) + (wordInfo.endTime?.nanos || 0) / 1e9,
        confidence: wordInfo.confidence || 0,
        speakerTag: wordInfo.speakerTag,
      }));
    }

    return {
      transcript: transcription,
      confidence,
      words,
    };
  } catch (error) {
    console.error("Error transcribing audio (long-running):", error);
    throw new Error("Failed to transcribe audio");
  }
}

/**
 * Extract audio from video and transcribe
 * Note: This requires server-side processing with FFmpeg or similar
 * For MVP, we'll use the video file directly with Speech-to-Text
 */
export async function transcribeVideo(
  videoUrl: string,
  options?: {
    languageCode?: string;
    enableAutomaticPunctuation?: boolean;
  }
): Promise<{
  transcript: string;
  confidence: number;
}> {
  // For video files, Speech-to-Text API can extract audio automatically
  // However, WEBM video format might need conversion
  // For now, we'll try direct transcription
  return transcribeAudio(videoUrl, options);
}

/**
 * Comprehensive audio analysis
 * Combines transcription with AI analysis for enhanced metadata
 */
export async function analyzeAudio(audioUrl: string): Promise<{
  transcript: string;
  confidence: number;
  duration?: number;
  suggestedTags: string[];
}> {
  try {
    const result = await transcribeAudio(audioUrl, {
      enableAutomaticPunctuation: true,
    });

    // For now, return basic transcription
    // In the future, we could integrate with Gemini AI to analyze the transcript
    // and extract topics, sentiment, etc.

    return {
      transcript: result.transcript,
      confidence: result.confidence,
      suggestedTags: [],
    };
  } catch (error) {
    console.error("Error analyzing audio:", error);
    throw new Error("Failed to analyze audio");
  }
}
