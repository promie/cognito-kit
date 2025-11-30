import { z } from 'zod'

export const bodySchema = z.object({
  email: z.email('Invalid email format'),
  code: z.string().min(1, 'Verification code is required'),
})

export type BodySchema = z.infer<typeof bodySchema>
