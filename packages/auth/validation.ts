import { z } from "zod";

export const loginSchema = z.object({
	email: z.email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	email: z.email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SignUpFormValues = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
	email: z.email("Invalid email address"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
	currentPassword: z.string().min(8, "Current password must be at least 8 characters"),
	newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
