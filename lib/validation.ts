import { z } from 'zod'

export const faceDescriptorSchema = z.array(z.number().finite()).length(128)
export const registerSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.email().transform((v) => v.toLowerCase()), password: z.string().min(8).max(72), role: z.enum(['student', 'lecturer']), matricNumber: z.string().trim().min(2).max(40).optional().or(z.literal('')), faceDescriptor: faceDescriptorSchema.optional() }).superRefine((v, ctx) => {
  if (v.role === 'student' && !v.matricNumber) ctx.addIssue({ code: 'custom', path: ['matricNumber'], message: 'Matric number is required for students.' })
  if (v.role === 'student' && !v.faceDescriptor) ctx.addIssue({ code: 'custom', path: ['faceDescriptor'], message: 'Face capture is required for students.' })
})
export const loginSchema = z.object({ email: z.email().transform((v) => v.toLowerCase()), password: z.string().min(1).max(72) })
