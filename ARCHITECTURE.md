# Architecture Overview - AI Life Management PWA

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface Layer                      │
├─────────────────────────────────────────────────────────────────┤
│  Next.js App Router  │  React Components  │  shadcn/ui + Tailwind│
│  ─────────────────────────────────────────────────────────────  │
│  • Dashboard Layout   │  • Note Components  │  • Button, Card   │
│  • Auth Pages        │  • Pillar Widgets   │  • Input, Badge   │
│  • Notes Pages       │  • Calendar Views   │  • Custom UI      │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                     State Management Layer                       │
├─────────────────────────────────────────────────────────────────┤
│                      Zustand Stores                              │
│  ─────────────────────────────────────────────────────────────  │
│  • Auth Store        │  • Notes Store      │  • Sync Store      │
│  • UI Store          │  • Tasks Store      │  • Pillars Store   │
│                                                                   │
│  Custom Hooks                                                     │
│  ─────────────────────────────────────────────────────────────  │
│  • useNotes()        │  • useSync()        │  • useTasks()      │
│  • useAuth()         │  • usePillars()     │  • useSearch()     │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                       Business Logic Layer                       │
├─────────────────────────────────────────────────────────────────┤
│  Sync Manager         │  Firebase Operations │  AI Services      │
│  ─────────────────────────────────────────────────────────────  │
│  • Online Detection  │  • CRUD Operations   │  • Gemini API     │
│  • Queue Management  │  • Real-time Sync    │  • Vision API     │
│  • Conflict Resolution│  • Batch Operations  │  • Speech-to-Text│
│  • Background Sync   │  • File Upload       │  • NLP Analysis   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                          API Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  Next.js API Routes (Server-Side)                               │
│  ─────────────────────────────────────────────────────────────  │
│  • /api/notes        │  • /api/tasks       │  • /api/ai         │
│  • /api/auth         │  • /api/sync        │  • /api/google     │
│                                                                   │
│  External APIs                                                    │
│  ─────────────────────────────────────────────────────────────  │
│  • Google Calendar   │  • Gmail API        │  • Drive API       │
│  • Maps API          │  • Contacts API     │  • More...         │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                        Data Storage Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  Local Storage (Offline)    │    Cloud Storage (Online)         │
│  ─────────────────────────────────────────────────────────────  │
│  IndexedDB (Dexie.js)       │    Firebase Services              │
│  • Notes Cache              │    • Firestore Database           │
│  • Tasks Cache              │    • Firebase Storage (Media)     │
│  • Pending Operations       │    • Firebase Auth                │
│  • User Preferences         │    • Firebase Analytics           │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Creating a Note (Offline-First)

```
User Input
    ↓
[UI Component] NoteEditor
    ↓
[Hook] useNotes().createNote()
    ↓
[Store] notesStore.addNote() ← Optimistic Update
    ↓
[Check] Is Online?
    ↓
┌─── YES ────────────────┐    ┌─── NO ─────────────────┐
│ POST /api/notes        │    │ Save to IndexedDB      │
│      ↓                 │    │      ↓                 │
│ Firebase Firestore     │    │ Queue for Sync         │
│      ↓                 │    │      ↓                 │
│ AI Analysis (async)    │    │ Update UI              │
│      ↓                 │    └────────────────────────┘
│ Update Store with ID   │
└────────────────────────┘
            ↓
    [UI Update] Note displayed with status
            ↓
    When back online: Background Sync
```

### Reading Notes

```
Component Mount
    ↓
[Hook] useNotes() - Auto-fetch
    ↓
[Check] Is Online?
    ↓
┌─── YES ────────────────┐    ┌─── NO ─────────────────┐
│ GET /api/notes         │    │ Load from IndexedDB    │
│      ↓                 │    │      ↓                 │
│ Firebase Query         │    │ Return cached notes    │
│      ↓                 │    │      ↓                 │
│ Apply Filters          │    │ Apply Filters          │
│      ↓                 │    │      ↓                 │
│ Paginate Results       │    │ Paginate Results       │
└────────────────────────┘    └────────────────────────┘
            ↓
    [Store] Update notes array
            ↓
    [UI] Render NoteCard components
```

### Sync Flow (Background)

```
App Initialization
    ↓
[Sync Manager] Initialize
    ↓
[Listeners] Set up online/offline events
    ↓
When Online Detected:
    ↓
[Check] Pending Operations?
    ↓
    YES
    ↓
For each operation:
    ┌─────────────────────────┐
    │ 1. Execute Operation    │
    │    (Create/Update/Delete)│
    │         ↓               │
    │ 2. Firebase Operation   │
    │         ↓               │
    │ 3. Success?             │
    │    ├─ YES: Remove from queue
    │    └─ NO:  Keep in queue, retry
    └─────────────────────────┘
            ↓
Update Sync Status in UI
    ↓
Periodic Sync (Every 5 min)
```

## Component Hierarchy

```
RootLayout
└── DashboardLayout
    ├── Header
    │   ├── Navigation
    │   ├── Search
    │   └── UserMenu
    ├── Main Content
    │   ├── Notes Page
    │   │   ├── NoteList
    │   │   │   └── NoteCard (multiple)
    │   │   ├── NoteFilters
    │   │   └── CreateNoteButton
    │   ├── Calendar Page
    │   ├── Tasks Page
    │   └── Pillars Page
    └── Footer
        ├── SyncStatus
        └── Links
```

## State Management Details

### Notes Store
```typescript
{
  // Data
  notes: Note[],
  selectedNote: Note | null,
  filters: { type, pillar, search, sortBy, sortOrder },

  // UI State
  loading: boolean,
  error: string | null,
  hasMore: boolean,
  page: number,

  // Actions
  setNotes,
  addNote,
  updateNote,
  removeNote,
  setFilters,
  resetFilters,
}
```

### Sync Store
```typescript
{
  // Status
  isOnline: boolean,
  isSyncing: boolean,
  pendingCount: number,
  lastSyncTime: Date | null,
  syncError: string | null,

  // Actions
  setIsOnline,
  setIsSyncing,
  setPendingCount,
  incrementPending,
  decrementPending,
}
```

## File Structure

```
app/
├── (auth)/                      # Auth routes group
│   ├── login/
│   └── signup/
├── (dashboard)/                 # Protected routes group
│   ├── notes/
│   ├── calendar/
│   ├── tasks/
│   ├── pillars/
│   ├── search/
│   └── ai-assistant/
├── api/                         # API routes
│   ├── notes/
│   │   ├── route.ts            # GET, POST /api/notes
│   │   └── [id]/route.ts       # GET, PUT, DELETE /api/notes/:id
│   ├── ai/
│   ├── google/
│   └── sync/
├── layout.tsx                   # Root layout
└── page.tsx                     # Home page

components/
├── ui/                          # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── badge.tsx
├── notes/                       # Note components
│   ├── note-card.tsx
│   ├── note-editor.tsx
│   └── note-filters.tsx
├── layout/                      # Layout components
│   ├── header.tsx
│   └── footer.tsx
└── ...

lib/
├── firebase/                    # Firebase utilities
│   ├── config.ts               # Firebase initialization
│   └── notes.ts                # Note CRUD operations
├── ai/                          # AI utilities
│   └── gemini.ts               # Gemini API integration
├── google-apis/                 # Google API wrappers
│   ├── calendar.ts
│   ├── gmail.ts
│   └── drive.ts
├── db/                          # IndexedDB utilities
│   └── offline-db.ts           # Dexie configuration
├── sync/                        # Sync utilities
│   └── sync-manager.ts         # Offline sync logic
└── utils.ts                     # Helper functions

hooks/
├── use-notes.ts                 # Notes management hook
├── use-sync.ts                  # Sync status hook
├── use-auth.ts                  # (To be created)
└── use-search.ts               # (To be created)

store/
├── auth-store.ts                # Auth state
├── notes-store.ts               # Notes state
├── sync-store.ts                # Sync state
└── ui-store.ts                  # UI state

types/
└── index.ts                     # All TypeScript types
```

## Security Model

### Firestore Security Rules
```javascript
// Users can only access their own data
match /notes/{noteId} {
  allow read, write: if request.auth.uid == resource.data.userId;
}

match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}
```

### API Route Security
```typescript
// All API routes check authentication
const userId = request.headers.get("x-user-id");
if (!userId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Storage Security
```javascript
// Files are private to each user
match /users/{userId}/{allPaths=**} {
  allow read, write: if request.auth.uid == userId;
  allow write: if request.resource.size < 50 * 1024 * 1024; // 50MB limit
}
```

## Performance Optimizations

### Implemented
- ✅ Optimistic UI updates (instant feedback)
- ✅ Cursor-based pagination (efficient queries)
- ✅ Local caching with IndexedDB
- ✅ Debounced search and autosave
- ✅ Service worker caching (PWA)
- ✅ Image optimization (Next.js Image)

### Planned
- 🔄 Virtual scrolling for long lists
- 🔄 Lazy loading for media content
- 🔄 Request deduplication
- 🔄 Background sync API
- 🔄 Prefetching for likely actions
- 🔄 WebP image conversion

## Scalability Considerations

### Current Design Supports
- ✅ Thousands of notes per user
- ✅ Multiple concurrent users
- ✅ Large media files (up to 50MB)
- ✅ Real-time synchronization
- ✅ Offline-first operation

### Future Scalability
- Implement database sharding if needed
- Add CDN for media files
- Consider Redis cache for hot data
- Implement rate limiting
- Add read replicas for geographic distribution

## Monitoring & Observability

### Built-in
- Firebase Analytics for user behavior
- Firebase Performance Monitoring
- Console logging for errors
- Build-time type checking

### To Add
- Error boundary with Sentry
- Performance metrics dashboard
- User feedback mechanism
- A/B testing framework
- Real user monitoring (RUM)
