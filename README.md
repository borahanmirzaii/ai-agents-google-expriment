# AI Life Management PWA

An AI-powered Progressive Web Application for holistic life management and self-improvement across 8 pillars of human well-being.

## Features

- **Multi-Format Note Capture**: Text, voice, images, and video notes with AI-powered transcription and analysis
- **AI Assistant**: Powered by Google Gemini for intelligent insights and recommendations
- **8 Pillars System**: Track and improve across Health, Finance, Career, Relationships, Mental Well-being, Learning, Recreation, and Contribution
- **Google Integration**: Seamless sync with Calendar, Gmail, Drive, and Contacts
- **Smart Scheduler**: AI-optimized task and event management
- **Offline-First**: Full functionality without internet connection using IndexedDB
- **PWA**: Installable app with push notifications and native-like experience

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, React 18
- **UI**: shadcn/ui, Tailwind CSS, Radix UI
- **Backend**: Firebase (Auth, Firestore, Storage, Functions, FCM)
- **AI/ML**: Google Gemini API, Cloud Vision, Speech-to-Text
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Offline**: Dexie (IndexedDB), Workbox (Service Worker)
- **APIs**: Google Calendar, Gmail, Drive, People, Maps

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ and npm installed
- A Google Cloud Platform account
- A Firebase project created
- API keys for the following services:
  - Firebase (Auth, Firestore, Storage, FCM)
  - Google Gemini API
  - Google Cloud APIs (Calendar, Gmail, Drive, etc.)

## Getting Started

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd ai-agents-google-expriment
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Set Up Environment Variables

Copy the example environment file and fill in your credentials:

\`\`\`bash
cp .env.local.example .env.local
\`\`\`

Edit \`.env.local\` and add your API keys:

\`\`\`env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Google AI / Gemini API
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key

# Google Cloud APIs
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Firebase Admin SDK (for server-side operations)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account-email
FIREBASE_ADMIN_PRIVATE_KEY="your-private-key"

# Push Notifications
NEXT_PUBLIC_VAPID_KEY=your-vapid-key
\`\`\`

### 4. Firebase Setup

#### Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable the following services:
   - Authentication (Google, Email/Password)
   - Firestore Database
   - Storage
   - Cloud Functions
   - Cloud Messaging (FCM)
   - Analytics

#### Set Up Firestore Security Rules

Create or update \`firestore.rules\`:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /notes/{noteId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    match /tasks/{taskId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    match /events/{eventId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }
  }
}
\`\`\`

Deploy rules:

\`\`\`bash
firebase deploy --only firestore:rules
\`\`\`

#### Set Up Storage Security Rules

Create or update \`storage.rules\`:

\`\`\`javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow write: if request.resource.size < 50 * 1024 * 1024; // 50MB limit
    }
  }
}
\`\`\`

Deploy rules:

\`\`\`bash
firebase deploy --only storage
\`\`\`

### 5. Google Cloud Setup

#### Enable Required APIs

Go to [Google Cloud Console](https://console.cloud.google.com/) and enable:

1. Google Calendar API
2. Gmail API
3. Google Drive API
4. People API (Contacts)
5. Maps JavaScript API
6. Cloud Vision API
7. Cloud Speech-to-Text API
8. Generative AI API (Gemini)

#### Create OAuth 2.0 Credentials

1. Go to APIs & Services > Credentials
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URIs:
   - \`http://localhost:3000/api/auth/callback\` (development)
   - \`https://your-domain.com/api/auth/callback\` (production)
4. Add scopes:
   - \`https://www.googleapis.com/auth/calendar\`
   - \`https://www.googleapis.com/auth/gmail.readonly\`
   - \`https://www.googleapis.com/auth/drive.file\`
   - \`https://www.googleapis.com/auth/contacts.readonly\`

### 6. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key for Gemini
3. Add it to your \`.env.local\` file

### 7. Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

\`\`\`
ai-life-management-app/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Main app routes
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   ├── notes/             # Note-related components
│   ├── calendar/          # Calendar components
│   ├── pillars/           # Pillar tracking components
│   └── layout/            # Layout components
├── lib/                   # Utility libraries
│   ├── firebase/          # Firebase configuration
│   ├── ai/                # AI/ML utilities
│   ├── google-apis/       # Google API integrations
│   ├── db/                # IndexedDB/Dexie
│   └── utils/             # Helper functions
├── hooks/                 # Custom React hooks
├── store/                 # Zustand state stores
├── types/                 # TypeScript type definitions
├── public/                # Static assets
│   ├── icons/             # PWA icons
│   ├── manifest.json      # PWA manifest
│   └── screenshots/       # App screenshots
└── firebase/              # Firebase configuration
    ├── functions/         # Cloud Functions
    ├── firestore.rules    # Firestore security rules
    └── storage.rules      # Storage security rules
\`\`\`

## Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm start\` - Start production server
- \`npm run lint\` - Run ESLint
- \`npm run type-check\` - Run TypeScript type checking

## Development Roadmap

### Phase 1: Foundation ✅
- [x] Next.js setup with TypeScript
- [x] shadcn/ui and Tailwind CSS
- [x] Firebase configuration
- [x] PWA setup
- [x] Offline database (Dexie)
- [x] TypeScript types

### Phase 2: Core Note System (In Progress)
- [ ] Text note editor
- [ ] Audio recording and transcription
- [ ] Image capture with OCR
- [ ] Video recording
- [ ] Media upload to Firebase Storage
- [ ] Offline sync logic

### Phase 3: AI Integration
- [ ] Gemini API integration
- [ ] Auto-categorization
- [ ] Chat interface
- [ ] Content summarization
- [ ] Entity extraction

### Phase 4: Google Services
- [ ] Google OAuth
- [ ] Calendar sync
- [ ] Gmail integration
- [ ] Drive backup
- [ ] Contacts sync

### Phase 5: 8 Pillars System
- [ ] Pillar data models
- [ ] Input forms for each pillar
- [ ] Dashboards and visualizations
- [ ] Progress tracking
- [ ] AI insights

### Phase 6: Scheduler & Memory
- [ ] Smart calendar
- [ ] Task management
- [ ] Memory timeline
- [ ] Recurring events
- [ ] Smart scheduling

### Phase 7: Search & Discovery
- [ ] Full-text search
- [ ] Semantic search
- [ ] Advanced filtering
- [ ] Voice search

### Phase 8: Notifications & Polish
- [ ] Push notifications
- [ ] Performance optimization
- [ ] Testing
- [ ] Accessibility

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or suggestions, please open an issue in the GitHub repository.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Firebase](https://firebase.google.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Google Gemini](https://deepmind.google/technologies/gemini/)
- [Tailwind CSS](https://tailwindcss.com/)
