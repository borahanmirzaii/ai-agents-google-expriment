# Phase 2: Core Note System - Implementation Plan

## Overview
Implement a complete multi-format note capture system with AI-powered analysis, offline-first architecture, and Firebase sync.

## Phase 2 Breakdown

### Phase 2.1: Text Notes & Foundation (Week 1-2)
**Priority: HIGH - Foundation for everything else**

#### Goals
- Complete text note CRUD operations
- Establish patterns for other note types
- Set up state management and API layer
- Implement offline sync

#### Tasks
1. **State Management**
   - Create Zustand stores (notes, auth, sync, ui)
   - Implement optimistic updates
   - Add offline detection

2. **API Layer**
   - POST /api/notes - Create note
   - GET /api/notes - List notes (with pagination, filters)
   - GET /api/notes/[id] - Get single note
   - PUT /api/notes/[id] - Update note
   - DELETE /api/notes/[id] - Delete note

3. **Firebase Operations**
   - CRUD operations for notes collection
   - Real-time listeners for sync
   - Batch operations for performance

4. **Offline Sync**
   - Queue pending operations
   - Background sync when online
   - Conflict resolution strategy

5. **UI Components**
   - Note list with infinite scroll
   - Note card component
   - Rich text editor (TipTap or similar)
   - Note creation modal/page
   - Search and filter UI

6. **AI Integration**
   - Auto-tagging with Gemini
   - Category suggestion
   - Summary generation for long notes

### Phase 2.2: Audio Notes (Week 2-3)
**Priority: MEDIUM**

#### Goals
- Record audio in browser
- Upload to Firebase Storage
- Transcribe using Google Speech-to-Text
- Display transcriptions

#### Tasks
1. **Audio Recording**
   - Use MediaRecorder API
   - Create audio recorder component
   - Show waveform visualization
   - Record controls (start, pause, stop)

2. **Storage**
   - Upload to Firebase Storage (users/{userId}/audio/)
   - Generate download URLs
   - Handle upload progress

3. **Transcription**
   - Call Cloud Speech-to-Text API
   - Store transcription in note content
   - Handle multiple languages

4. **UI**
   - Audio player component
   - Transcription editor (allow corrections)
   - Audio waveform display

### Phase 2.3: Image Notes (Week 3-4)
**Priority: MEDIUM**

#### Goals
- Capture/upload images
- Extract text with OCR
- Compress and optimize images
- Display image thumbnails

#### Tasks
1. **Image Capture**
   - Camera access via getUserMedia
   - File upload component
   - Image cropping/editing
   - Multiple image support

2. **Processing**
   - Client-side compression
   - Generate thumbnails
   - Upload to Firebase Storage

3. **OCR**
   - Google Cloud Vision API integration
   - Extract text from images
   - Store as note content

4. **UI**
   - Image gallery component
   - Lightbox for full view
   - Image metadata display

### Phase 2.4: Video Notes (Week 4-5)
**Priority: LOW (Nice to have)**

#### Goals
- Record video in browser
- Extract frames for thumbnails
- Optional transcription
- Stream optimization

#### Tasks
1. **Video Recording**
   - MediaRecorder for video
   - Record controls
   - Time limit (e.g., 5 min)

2. **Processing**
   - Generate thumbnail from first frame
   - Compress video
   - Upload to Storage

3. **Transcription**
   - Extract audio track
   - Transcribe with Speech-to-Text
   - Timestamp alignment

4. **UI**
   - Video player component
   - Thumbnail generation
   - Progress indicators

### Phase 2.5: Sync & Performance (Week 5-6)
**Priority: HIGH**

#### Goals
- Robust offline sync
- Performance optimization
- Error handling
- Testing

#### Tasks
1. **Sync Engine**
   - Implement background sync
   - Handle network failures
   - Retry logic with exponential backoff
   - Sync status indicators

2. **Performance**
   - Lazy loading for media
   - Virtual scrolling for lists
   - Optimize Firebase queries
   - Cache management

3. **Error Handling**
   - User-friendly error messages
   - Retry mechanisms
   - Fallback strategies

4. **Testing**
   - Unit tests for utilities
   - Integration tests for API
   - E2E tests for critical flows

## Technical Architecture

### State Management Structure
```typescript
// stores/notes-store.ts
{
  notes: Note[],
  loading: boolean,
  error: string | null,
  filters: FilterState,

  // Actions
  fetchNotes: () => Promise<void>,
  createNote: (note: NoteFormData) => Promise<void>,
  updateNote: (id: string, data: Partial<Note>) => Promise<void>,
  deleteNote: (id: string) => Promise<void>,
  setFilters: (filters: Partial<FilterState>) => void,
}

// stores/sync-store.ts
{
  isOnline: boolean,
  isSyncing: boolean,
  pendingCount: number,
  lastSyncTime: Date | null,

  // Actions
  syncNow: () => Promise<void>,
  checkOnlineStatus: () => void,
}
```

### API Response Format
```typescript
// Success
{
  success: true,
  data: T,
  meta?: {
    total?: number,
    page?: number,
    hasMore?: boolean,
  }
}

// Error
{
  success: false,
  error: string,
  code?: string,
}
```

### File Storage Strategy
```
users/
  {userId}/
    audio/
      {noteId}.webm
    images/
      {noteId}/
        original.jpg
        thumbnail.jpg
    videos/
      {noteId}/
        video.mp4
        thumbnail.jpg
```

### Offline Sync Strategy
1. **Optimistic Updates**: Update UI immediately, queue Firebase operation
2. **Background Sync**: When online, process queue in order
3. **Conflict Resolution**: Last-write-wins with timestamp comparison
4. **Visual Indicators**: Show sync status per note

## Success Criteria

### Phase 2.1 (Text Notes)
- ✅ Can create, read, update, delete text notes
- ✅ Rich text formatting works
- ✅ Offline mode works seamlessly
- ✅ AI tagging suggests relevant tags
- ✅ Search and filter work correctly

### Phase 2.2 (Audio)
- ✅ Can record audio in browser
- ✅ Audio uploads to Firebase Storage
- ✅ Transcription is accurate (>90%)
- ✅ Can play back audio

### Phase 2.3 (Image)
- ✅ Can capture/upload images
- ✅ OCR extracts text accurately
- ✅ Images are compressed and optimized
- ✅ Thumbnails display quickly

### Phase 2.4 (Video)
- ✅ Can record video clips
- ✅ Thumbnails are generated
- ✅ Video playback works
- ✅ Optional transcription available

### Phase 2.5 (Sync & Performance)
- ✅ Offline sync is reliable
- ✅ No data loss on network failures
- ✅ App feels fast (<200ms interactions)
- ✅ Handles 1000+ notes efficiently

## Next Steps After Phase 2
- Phase 3: AI Integration (advanced analysis, insights)
- Phase 4: Google Services (Calendar, Gmail, Drive)
- Phase 5: 8 Pillars System (health, finance, etc.)

## Current Focus: Phase 2.1
Starting with text notes to establish:
- API patterns
- State management patterns
- Offline sync patterns
- UI component patterns

These patterns will be reused for audio, image, and video notes.
