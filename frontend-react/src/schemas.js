import { z } from 'zod'

const phoneSchema = z.string().refine(value => {
  const digits = value.replace(/\D/g, '')
  return /^[\d\s()+-]+$/.test(value) && digits.length >= 7 && digits.length <= 15
}, "Phone number must contain 7 to 15 digits")

export const memberSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters"),

  phone: phoneSchema,

  email: z.string()
    .email("Must be a valid email address")
    .optional()
    .or(z.literal(''))
})

export const branchSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters"),
  phone: phoneSchema
})

export const trainerSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters"),
  phone: phoneSchema,
  email: z.string().email("Must be a valid email address"),
  certification: z.string().min(2, "Certification must be at least 2 characters")
})

export const membershipPlanSchema = z.object({
  planName: z.string()
    .min(2, "Name must be at least 2 characters"),
  price: z.coerce.number().positive("Price must be greater than 0")
})

export const membershipSchema = z.object({
  memberId: z.string().min(1, "This field is required"),
  planId: z.string().min(1, "This field is required"),
  startDate: z.string().min(1, "Date is required"),
  endDate: z.string().min(1, "Date is required")
})

export const personalTrainingAssignmentSchema = z.object({
  trainerId: z.string().min(1, "This field is required"),
  memberId: z.string().min(1, "This field is required"),
  startDate: z.string().min(1, "Date is required")
})

export const classSchema = z.object({
  branchId: z.string().min(1, "This field is required"),
  trainerId: z.string().min(1, "This field is required"),
  className: z.string()
    .min(2, "Name must be at least 2 characters"),
  scheduleTime: z.string().min(1, "Date is required"),
  durationMinutes: z.coerce.number().int().positive("Duration must be a positive whole number"),
  capacity: z.coerce.number().int().positive("Capacity must be a positive whole number")
})

export const classBookingSchema = z.object({
  memberId: z.string().min(1, "This field is required"),
  classId: z.string().min(1, "This field is required"),
  bookingDate: z.string().min(1, "Date is required")
})

export const paymentSchema = z.object({
  membershipId: z.string().min(1, "This field is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paymentDate: z.string().min(1, "Date is required")
})

export const equipmentSchema = z.object({
  branchId: z.string().min(1, "This field is required"),
  name: z.string()
    .min(2, "Name must be at least 2 characters"),
  quantity: z.coerce.number().int().nonnegative("Quantity must be zero or a positive whole number")
})

export const trainerBranchSchema = z.object({
  trainerId: z.string().min(1, "This field is required"),
  branchId: z.string().min(1, "This field is required")
})

export const adminSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters"),

  email: z.string()
    .email("Must be a valid email address"),

  phone: phoneSchema,

  password: z.string()
    .min(6, "Password must be at least 6 characters")
})
