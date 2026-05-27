"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@repo/auth/validation";
import { authClient } from "~/lib/auth";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { LoadingSpinner } from "~/components/shared/loading-spinner";

function ResetPasswordContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const token = searchParams.get("token");

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const form = useForm<ResetPasswordFormValues>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: {
			password: "",
		},
	});

	const handleReset = async (values: ResetPasswordFormValues) => {
		if (!token) {
			setError("Missing password reset token in URL");
			return;
		}
		setLoading(true);
		setError("");
		const { error: resetError } = await authClient.resetPassword({
			newPassword: values.password,
			token,
		});
		setLoading(false);
		if (resetError) {
			setError(resetError.message || "Failed to reset password");
		} else {
			setSuccess(true);
			setTimeout(() => router.push("/login"), 2000);
		}
	};

	if (success) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<CardTitle className="text-2xl">Password reset!</CardTitle>
						<CardDescription>
							Your password has been changed successfully. Redirecting to login...
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Reset your password</CardTitle>
					<CardDescription>Enter a new password for your account</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(handleReset)} className="flex flex-col gap-4">
							{error && (
								<p className="text-destructive text-sm text-center">{error}</p>
							)}
							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>New Password</FormLabel>
										<FormControl>
											<Input
												type="password"
												placeholder="••••••••"
												autoComplete="new-password"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button id="reset-submit" type="submit" size="lg" className="w-full" disabled={loading}>
								{loading ? "Resetting..." : "Reset Password"}
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

export default function ResetPasswordPage() {
	return (
		<Suspense fallback={<div className="flex min-h-screen items-center justify-center"><LoadingSpinner /></div>}>
			<ResetPasswordContent />
		</Suspense>
	);
}
