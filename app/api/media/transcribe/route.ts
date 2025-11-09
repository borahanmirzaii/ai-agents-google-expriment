/**
 * Transcription API Route
 * Performs speech-to-text transcription on audio/video using Google Cloud Speech-to-Text
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeAudio, transcribeVideo } from "@/lib/google-apis/speech-to-text";

export async function POST(request: NextRequest) {
  try {
    const { mediaUrl, mediaType } = await request.json();

    if (!mediaUrl) {
      return NextResponse.json(
        { error: "Media URL is required" },
        { status: 400 }
      );
    }

    if (!mediaType || !["audio", "video"].includes(mediaType)) {
      return NextResponse.json(
        { error: "Valid media type (audio or video) is required" },
        { status: 400 }
      );
    }

    // Perform transcription based on media type
    let result;
    if (mediaType === "audio") {
      result = await analyzeAudio(mediaUrl);
    } else {
      result = await transcribeVideo(mediaUrl);
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Transcription API error:", error);
    return NextResponse.json(
      {
        error: "Failed to transcribe media",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
