/**
 * OCR API Route
 * Performs Optical Character Recognition on images using Google Cloud Vision
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeImage } from "@/lib/google-apis/vision";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Perform OCR and image analysis
    const result = await analyzeImage(imageUrl);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("OCR API error:", error);
    return NextResponse.json(
      {
        error: "Failed to perform OCR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
