"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@repo/auth/validation"
import { authClient } from "~/lib/auth";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";

export default function ForgotPasswordPage() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const [emailValue, setEmailValue] = useState("");

	const form = useForm<ForgotPasswordFormValues>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: {
			email: "",
		},
	});

	const handleResetRequest = async (values: ForgotPasswordFormValues) => {
		setLoading(true);
		setError("");
		const { error: resetError } = await authClient.requestPasswordReset({
			email: values.email,
			redirectTo: "/reset-password",
		});
		setLoading(false);
		if (resetError) {
			setError(resetError.message || "Failed to request password reset");
		} else {
			setEmailValue(values.email);
			setSuccess(true);
		}
	};

	if (success) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<CardTitle className="text-2xl">Check your email</CardTitle>
						<CardDescription>
							We&apos;ve sent a password reset link to <strong>{emailValue}</strong>. Please check your inbox.
						</CardDescription>
					</CardHeader>
					<CardFooter className="justify-center">
						<Link href="/login">
							<Button variant="outline">Back to Login</Button>
						</Link>
					</CardFooter>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Forgot your password?</CardTitle>
					<CardDescription>Enter your email and we&apos;ll send you a reset link</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(handleResetRequest)} className="flex flex-col gap-4">
							{error && (
								<p className="text-destructive text-sm text-center">{error}</p>
							)}
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input
												type="email"
												placeholder="you@example.com"
												autoComplete="email"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button id="forgot-submit" type="submit" size="lg" className="w-full" disabled={loading}>
								{loading ? "Sending link..." : "Send Reset Link"}
							</Button>
						</form>
					</Form>
				</CardContent>
				<CardFooter className="justify-center">
					<Link href="/login" className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline">
						Back to login
					</Link>
				</CardFooter>
			</Card>
		</div>
	);
}
