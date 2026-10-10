import { z } from "zod";

// Only presence is checked here: the password rules apply at registration, and
// the server decides whether the credentials are right.
export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or username"),
  password: z.string().min(1, "Enter your password"),
});

export type LoginValues = z.infer<typeof loginSchema>;
