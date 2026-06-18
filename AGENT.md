# Agent Instructions: Online Quiz Platform (Next.js + TypeScript + PostgreSQL + Prisma + Tailwind + Redis)

You are an expert AI developer agent tasked with building, testing, and preparing for deployment a complete online quiz platform designed for professors and students. The platform must be optimized for deployment on **EasyPanel** (a Docker-based control panel).

---

## 1. Technological Stack

*   **Frontend & Backend**: Next.js 14+ (App Router) with TypeScript
*   **Database**: PostgreSQL
*   **ORM**: Prisma
*   **Caching & Locks**: Redis (via `ioredis`)
*   **Styling**: Tailwind CSS (Premium Modern UI, Glassmorphism, animations)
*   **Auth**: NextAuth.js (or custom JWT-based authentication) with Role-Based Access Control (RBAC)
*   **Deployment**: EasyPanel (using Docker multi-stage build)

---

## 2. Platform Architecture & EasyPanel Configuration

EasyPanel runs services inside Docker containers. To deploy successfully:
1.  **PostgreSQL & Redis Services**: These will be created as separate services inside EasyPanel. EasyPanel automatically exposes internal connection strings (e.g., `postgres://...` and `redis://...`).
2.  **Environment Variables**: The Next.js application will read:
    *   `DATABASE_URL`: Connection string for PostgreSQL.
    *   `REDIS_URL`: Connection string for Redis.
    *   `NEXTAUTH_SECRET` / `JWT_SECRET`: Secret key for authentication.
    *   `NEXTAUTH_URL`: Canonical URL of the application.
3.  **Database Migrations**: During the container startup, Prisma migrations must run using:
    ```bash
    npx prisma migrate deploy
    ```
    This is best done via an entrypoint script (`entrypoint.sh`) in the production Dockerfile.

---

## 3. Database Schema (Prisma)

Define your schema in `prisma/schema.prisma`. Ensure standard relations are mapped properly:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  PROFESSOR
  STUDENT
}

enum MessageType {
  GENERAL
  INDIVIDUAL
}

model User {
  id            String    @id @default(uuid())
  username      String    @unique
  email         String    @unique
  password      String    // Hashed
  role          Role      @default(STUDENT)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  quizzesCreated Quiz[]    @relation("ProfessorQuizzes")
  attempts       Attempt[] @relation("StudentAttempts")
  sentMessages   Message[] @relation("SenderMessages")
  receivedMessages Message[] @relation("ReceiverMessages")
}

model Quiz {
  id          String     @id @default(uuid())
  title       String
  description String?
  isActive    Boolean    @default(false)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // Relations
  professorId String
  professor   User       @relation("ProfessorQuizzes", fields: [professorId], references: [id], onDelete: Cascade)
  questions   Question[]
  attempts    Attempt[]
}

model Question {
  id        String   @id @default(uuid())
  text      String
  quizId    String
  quiz      Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  options   Option[]
  answers   Answer[]
}

model Option {
  id         String   @id @default(uuid())
  text       String
  isCorrect  Boolean  @default(false)
  questionId String
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  studentAnswers Answer[] // Tracks answers selected by students
}

model Attempt {
  id                 String   @id @default(uuid())
  score              Float    // Calculated final score out of 10
  correctAnswersCount Int
  totalQuestionsCount Int
  createdAt          DateTime @default(now())

  // Relations
  studentId      String
  student        User     @relation("StudentAttempts", fields: [studentId], references: [id], onDelete: Cascade)
  quizId         String
  quiz           Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  answers        Answer[]

  @@unique([studentId, quizId]) // Ensures only ONE attempt per student per quiz
}

model Answer {
  id         String   @id @default(uuid())
  attemptId  String
  attempt    Attempt  @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  questionId String
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  optionId   String
  option     Option   @relation(fields: [optionId], references: [id], onDelete: Cascade)
}

model Message {
  id         String      @id @default(uuid())
  content    String
  type       MessageType @default(INDIVIDUAL)
  createdAt  DateTime    @default(now())

  // Relations
  senderId   String
  sender     User        @relation("SenderMessages", fields: [senderId], references: [id], onDelete: Cascade)
  receiverId String?     // Nullable for general messages
  receiver   User?       @relation("ReceiverMessages", fields: [receiverId], references: [id], onDelete: Cascade)
}
```

---

## 4. Step-by-Step Implementation Roadmap

### Phase 1: Environment & Project Setup
1.  Initialize Next.js app with TypeScript, Tailwind, and App Router.
2.  Install required dependencies:
    *   Prisma: `@prisma/client`, `prisma` (dev)
    *   Redis: `ioredis`
    *   Authentication: `next-auth` or `jose` / `bcryptjs`
    *   Icons & UI helpers: `lucide-react`, `framer-motion`
3.  Configure tailwind colors and establish a sleek, premium dark-mode-first styling palette (e.g., slate/emerald/violet accents, blurred glass backdrops, smooth scale transitions).

### Phase 2: Auth and Middleware Protection
1.  Implement Auth Pages (Login: `/auth/login`, Register: `/auth/register`).
2.  Setup Next.js Middleware (`middleware.ts`) to intercept routes:
    *   Protect `/professor/*` to only allow authenticated users with `role: PROFESSOR`.
    *   Protect `/student/*` to only allow authenticated users with `role: STUDENT`.
    *   Redirect unauthenticated users to `/auth/login`.

### Phase 3: Redis Utilities & Attempt Locking
1.  Create `lib/redis.ts` to export a singleton Redis client.
2.  **Concurrency / Anti-Cheat Control**: When a student requests to start or submit a quiz, use Redis to implement a distributed lock or check:
    *   Set a key `quiz:attempt:lock:${studentId}:${quizId}` with an expiration to prevent double-click or simultaneous tab submissions.
    *   Cache dashboard statistics (e.g., total active quizzes, student average grades) with a short TTL to reduce heavy database aggregations.

### Phase 4: Professor Dashboard (`/professor`)
1.  **Dashboard Overview**: Highlight metrics: total quizzes created, active quizzes, registered students, and recent submissions.
2.  **Quiz CRUD (`/professor/quizzes`)**:
    *   List all quizzes with active/inactive toggles.
    *   Create / Edit forms for quiz title, description, and status.
3.  **Question Manager (`/professor/quizzes/[id]/questions`)**:
    *   Inline list of questions with their options.
    *   Form to add/edit questions and options. Validate that exactly one option is marked as correct.
4.  **Student & Grades View (`/professor/grades`)**:
    *   Display a list of student accounts.
    *   Detailed view per student showing all quiz attempts, answers chosen, scores, and dates.
5.  **Messaging Portal (`/professor/messages`)**:
    *   Send global messages to all students.
    *   Send individual messages to selected students.

### Phase 5: Student Dashboard (`/student`)
1.  **Dashboard Overview**: Display available quizzes, past attempts, and latest messages from the professor.
2.  **Quiz Explorer (`/student/quizzes`)**:
    *   Only show quizzes that are `isActive = true`.
    *   Identify which quizzes have already been attempted (disable button).
3.  **Quiz Execution (`/student/quizzes/[id]/take`)**:
    *   Render questions one by one or as a list.
    *   Add a warning/confirmation before final submission.
    *   On submit, calculate grade on the backend server:
        $$\text{Grade} = \left(\frac{\text{Correct Answers}}{\text{Total Questions}}\right) \times 10$$
    *   Store answers and attempt score in database. Release Redis lock.
4.  **Grades History (`/student/grades`)**: List past attempts with scores, total correct answers, and details of which answers were correct/incorrect.
5.  **Message Box (`/student/messages`)**: Read general announcements and personal direct messages sent by the professor.

---

## 5. UI/UX Design System (Tailwind)

Follow these rules to deliver a premium user interface:
*   **Colors**: Avoid default primaries. Use a sophisticated palette like dark neutral slate (`bg-slate-950`), text in soft grey (`text-slate-200`), card backgrounds with translucent borders (`bg-slate-900/60 backdrop-blur-md border border-slate-800`), and highlights in indigo/violet gradients.
*   **Transitions**: Buttons and interactive elements should have `transition-all duration-300 ease-out` with subtle scale-up on hover (`hover:scale-[1.02]`) and active compression.
*   **States**: Always include skeletons or loading spinners during page navigation or data mutations. Show success notifications upon quiz completion or message delivery.

---

## 6. EasyPanel Deployment Files

To compile and package the app for EasyPanel, use the following production files:

### `Dockerfile`
Create a `Dockerfile` at the root of the project:

```dockerfile
# Multi-stage build
FROM node:18-alpine AS base

# 1. Install dependencies
FROM base AS deps
RUN apk add --no-code libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma Client
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Setup startup entrypoint script
COPY --chown=nextjs:nodejs entrypoint.sh ./
RUN chmod +x entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT 3000

ENTRYPOINT ["./entrypoint.sh"]
```

### `entrypoint.sh`
Create a shell script `entrypoint.sh` to handle migrations and startup:

```bash
#!/bin/sh

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting Next.js application..."
node server.js
```

### `next.config.js`
Ensure standard standalone output is enabled in Next.js config:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
}

module.exports = nextConfig
```

---

## 7. Quality Assurance Checklist

*   [ ] **Strict Type Safety**: No `any` types allowed. Use Prisma-generated types for inputs and returns.
*   [ ] **Double Submission Prevention**: Test multiple rapid clicks on quiz submission and verify that only 1 attempt is registered and no duplicate rows are created.
*   [ ] **Responsive UI**: Test dashboards on viewport widths from 320px to 1440px.
*   [ ] **Auth Guards**: Try to manually access `/professor` from a Student account or an unauthenticated browser, and confirm a strict redirect to `/auth/login` or a `403` status.
