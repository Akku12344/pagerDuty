import * as z from "zod";

export const teamSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
});

export const emailSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
});
