import { z } from 'zod'

export const bodySchema = z.object({
    email: z.email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
})

export type BodySchema = z.infer<typeof bodySchema>
