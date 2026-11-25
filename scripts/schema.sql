CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL CHECK ("role" IN ('student', 'lecturer')),
  "matricNumber" TEXT UNIQUE,
  "faceDescriptor" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS "Course" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "lecturerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT PRIMARY KEY,
  "courseId" TEXT NOT NULL REFERENCES "Course"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "code" TEXT NOT NULL UNIQUE CHECK (char_length("code") = 6),
  "lat" DOUBLE PRECISION NOT NULL,
  "lng" DOUBLE PRECISION NOT NULL,
  "radiusMeters" INTEGER NOT NULL DEFAULT 50,
  "startsAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS "Attendance" (
  "id" TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL REFERENCES "Session"("id") ON DELETE CASCADE,
  "studentId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "distanceMeters" DOUBLE PRECISION NOT NULL,
  "faceMatchScore" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'present',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Attendance_sessionId_studentId_key" UNIQUE ("sessionId", "studentId")
);
