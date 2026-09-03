import { z } from 'zod'

export const memberSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .regex(/^[A-Za-z\s]+$/, "Name can only contain letters and spaces"),

  phone: z.string()
    .regex(/^\d{7,15}$/, "Phone number must be 7 to 15 digits, no letters or symbols"),

  email: z.string()
    .email("Must be a valid email address")
    .optional()
    .or(z.literal(''))
})