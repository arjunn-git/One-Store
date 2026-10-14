import { z } from "zod";

export const emailOtpRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Please provide a valid email address." })
    .toLowerCase(),
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and privacy notice to continue.",
  }),
  marketingConsent: z.boolean().default(false),
});

export const emailLoginRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Please provide a valid email address." })
    .toLowerCase(),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().email(),
  otp: z
    .string()
    .trim()
    .length(6, { message: "The verification code must be exactly 6 digits." })
    .regex(/^\d+$/, { message: "Code must contain numbers only." }),
});

export const phoneOtpRequestSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{6,14}$/, {
      message: "Phone number must be in E.164 international format (e.g., +919876543210 or +447911123456).",
    }),
});
