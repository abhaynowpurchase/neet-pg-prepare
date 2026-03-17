# NEET PG Story Learning

A production-ready web application for NEET PG / INI-CET / UPSC CMO exam preparation using immersive **story-based learning**.

Learn through compelling medical narratives — understand concepts deeply instead of just memorizing them.

---

## Features

- **Story-Based Learning** — Distraction-free reader with adjustable font size and dark mode
- **Previous Year Questions** — NEET PG, INI-CET, UPSC CMO questions with detailed explanations
- **High-Yield Notes** — Exam-focused key points after every story
- **Quiz Mode** — Timed quizzes with instant feedback and score tracking
- **Progress Tracking** — Track completed chapters and quiz scores per chapter
- **Authentication** — Email/password sign-up and sign-in via NextAuth

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS + shadcn/ui |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Auth | NextAuth v4 |

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com) and create a free cluster.
2. Create a database user (Settings → Database Access → Add New User).
3. Allow network access (Network Access → Add IP → Allow from Anywhere for dev).
4. Get your connection string from Clusters → Connect → Drivers.

### 3. Configure Environment Variables

Copy the example env file:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# MongoDB Atlas — replace <db_password> with your actual password
MONGODB_URI=mongodb+srv://admin:<db_password>@cluster0.f9ueuqn.mongodb.net/neetpg_story_learning

# NextAuth — generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

Generate a secure `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Seed the Database

Populate the database with Community Medicine content (subjects, chapters, questions, high-yield topics):

```bash
npm run seed
```

This will create:
- 1 subject: Community Medicine
- 3 chapters: Epidemiology, Screening, Biostatistics
- 12 questions from NEET PG, INI-CET, UPSC CMO
- 4 high-yield topics

---

## Project Structure

```
neetpg-story-learning/
├── app/
│   ├── (auth)/               # Login & Register pages
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── dashboard/        # Home dashboard
│   │   ├── subjects/         # Subject listing & detail
│   │   ├── chapters/         # Chapter detail, story reader, quiz
│   │   ├── high-yield/       # High-yield topics
│   │   └── progress/         # User progress
│   ├── api/                  # API routes
│   │   ├── auth/             # NextAuth + register
│   │   ├── subjects/
│   │   ├── chapters/
│   │   └── progress/
│   ├── layout.tsx
│   ├── page.tsx              # Landing page
│   └── globals.css
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── auth/                 # Login & Register forms
│   ├── dashboard/            # Subject/Chapter cards, stats
│   ├── navigation/           # Sidebar, Header, MobileNav
│   ├── story/                # Story reader
│   ├── quiz/                 # Quiz mode
│   └── providers/            # Session provider
├── lib/
│   ├── mongodb.ts            # MongoDB connection utility
│   ├── auth.ts               # NextAuth configuration
│   └── utils.ts              # Helper utilities
├── models/                   # Mongoose schemas
│   ├── User.ts
│   ├── Subject.ts
│   ├── Chapter.ts
│   ├── Question.ts
│   ├── HighYieldTopic.ts
│   └── UserProgress.ts
├── hooks/
│   └── use-toast.ts
├── scripts/
│   └── seed.ts               # Database seeder
├── types/
│   └── index.ts              # TypeScript interfaces
└── .env.local                # Environment variables
```

---

## Database Models

### User
```typescript
{ name, email, password (hashed), image?, createdAt }
```

### Subject
```typescript
{ name, description, icon, color, order }
```

### Chapter
```typescript
{ subjectId, title, description, storyContent, highYieldNotes, order, estimatedReadTime }
```

### Question
```typescript
{
  chapterId, question, options[4], correctAnswer (0–3),
  explanation, examType (NEET_PG | INI_CET | UPSC_CMO), year, difficulty
}
```

### HighYieldTopic
```typescript
{ chapterId, title, description, keyPoints[], order }
```

### UserProgress
```typescript
{ userId, chapterId, storyCompleted, quizScore, questionsAttempted, questionsCorrect, lastAccessedAt }
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run seed` | Seed database with sample data |
| `npm run lint` | Run ESLint |

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub.
2. Import project at [vercel.com](https://vercel.com).
3. Add environment variables (`MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`).
4. Deploy.

Set `NEXTAUTH_URL` to your production URL (e.g., `https://yourapp.vercel.app`).

---

## Adding More Content

To add more subjects, chapters, or questions, extend the seed script at `scripts/seed.ts` or use the MongoDB Atlas UI / Compass.

Story content supports HTML tags for rich formatting:
- `<h2>`, `<h3>` for section headings
- `<p>` for paragraphs
- `<strong>` for bold text
- `<div class="highlight-box">` for callout boxes
- `<blockquote>` for quotes

---

## License

MIT
