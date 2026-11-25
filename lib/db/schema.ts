import { boolean, doublePrecision, integer, jsonb, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'

export const users = pgTable('User', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('passwordHash').notNull(),
  role: text('role').notNull(),
  matricNumber: text('matricNumber').unique(),
  faceDescriptor: jsonb('faceDescriptor').$type<number[]>(),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
})

export const courses = pgTable('Course', {
  id: text('id').primaryKey(),
  code: text('code').notNull(),
  title: text('title').notNull(),
  lecturerId: text('lecturerId').notNull().references(() => users.id, { onDelete: 'cascade' }),
})

export const sessions = pgTable('Session', {
  id: text('id').primaryKey(),
  courseId: text('courseId').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  code: text('code').notNull().unique(),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  radiusMeters: integer('radiusMeters').notNull().default(50),
  startsAt: timestamp('startsAt', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  isActive: boolean('isActive').notNull().default(true),
})

export const attendance = pgTable('Attendance', {
  id: text('id').primaryKey(),
  sessionId: text('sessionId').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  studentId: text('studentId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  distanceMeters: doublePrecision('distanceMeters').notNull(),
  faceMatchScore: doublePrecision('faceMatchScore').notNull(),
  status: text('status').notNull().default('present'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [unique().on(table.sessionId, table.studentId)])
