import { z } from "zod"

export const UserSchema = z.object({
  userId: z.number(),
  id: z.number(),
  name: z.string(),
})

export type User = z.infer<typeof UserSchema>
