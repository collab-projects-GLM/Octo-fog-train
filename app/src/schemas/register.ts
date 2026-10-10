import { z } from "zod";

export const registerSchema = z
  .object({
    // No "@": the server rejects it so a username can't be mistaken for an email.
    username: z
      .string()
      .trim()
      .min(3, "Minimum 3 characters")
      .max(150, "Maximum 150 characters")
      .regex(
        /^[\p{L}\p{N}_.+-]+$/u,
        "Letters, numbers and . + - _ only",
      ),
    email: z.email("Enter a valid email"),
    // The server also rejects common and all-numeric passwords; those errors
    // are attached to this field when they come back.
    password: z.string().min(8, "Minimum 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

export type RegisterValues = z.infer<typeof registerSchema>;
