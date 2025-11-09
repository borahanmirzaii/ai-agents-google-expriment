import { NextRequest, NextResponse } from "next/server";
import { createNote, getNotes } from "@/lib/firebase/notes";
import { analyzeNoteContent } from "@/lib/ai/gemini";
import { NoteFormData } from "@/types";

/**
 * GET /api/notes
 * Get all notes for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Get userId from session/auth
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "all";
    const pillar = searchParams.get("pillar") || "all";
    const page = parseInt(searchParams.get("page") || "1");

    const result = await getNotes(userId, {
      type: type as never,
      pillar: pillar as never,
      page,
    });

    return NextResponse.json({
      success: true,
      data: result.notes,
      meta: {
        hasMore: result.hasMore,
        page,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/notes:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch notes",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notes
 * Create a new note
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Get userId from session/auth
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: NoteFormData & { content: string } = await request.json();

    // Validate required fields
    if (!body.title || !body.content || !body.type) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create note
    const note = await createNote(userId, body);

    // Analyze note content in background (don't wait)
    if (body.content.length > 50) {
      analyzeNoteContent(body.content)
        .then(async (metadata) => {
          // Update note with AI metadata
          const { updateNote } = await import("@/lib/firebase/notes");
          await updateNote(note.id, userId, { aiMetadata: metadata });
        })
        .catch((error) => {
          console.error("Failed to analyze note:", error);
        });
    }

    return NextResponse.json(
      {
        success: true,
        data: note,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/notes:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create note",
      },
      { status: 500 }
    );
  }
}
