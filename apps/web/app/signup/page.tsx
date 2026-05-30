"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignUpFormValues } from "@repo/auth/validation";
import { authClient } from "~/lib/auth";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Separator } from "~/components/ui/separator";
import { CheckCircle2, Mail, Zap, Loader2 } from "lucide-react";

function GoogleIcon() {
	return (
		<svg viewBox="0 0 24 24" className="size-4">
			<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
			<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
			<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
			<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
		</svg>
	);
}

export default function SignUpPage() {
	const [loading, setLoading] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const [emailValue, setEmailValue] = useState("");

	const form = useForm<SignUpFormValues>({
		resolver: zodResolver(signupSchema),
		defaultValues: { name: "", email: "", password: "" },
	});

	const handleSignUp = async (values: SignUpFormValues) => {
		setLoading(true);
		setError("");
		const { error: signUpError } = await authClient.signUp.email({
			email: values.email,
			password: values.password,
			name: values.name,
		});
		setLoading(false);
		if (signUpError) {
			setError(signUpError.message || "Failed to sign up");
		} else {
			setEmailValue(values.email);
			setSuccess(true);
		}
	};

	const handleGoogleSignIn = async () => {
		setGoogleLoading(true);
		setError("");
		await authClient.signIn.social({
			provider: "google",
			callbackURL: `${window.location.origin}/`,
		});
	};

	if (success) {
		return (
			<div className="min-h-screen flex items-center justify-center px-4 bg-background">
				<div className="w-full max-w-md space-y-6 text-center">
					<div className="flex justify-center">
						<div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 border border-green-500/25">
							<CheckCircle2 className="h-8 w-8 text-green-600" />
						</div>
					</div>
					<div className="space-y-2">
						<h1 className="text-3xl font-bold text-foreground">Check your inbox</h1>
						<p className="text-muted-foreground">
							We&apos;ve sent a verification link to{" "}
							<span className="font-semibold text-foreground">{emailValue}</span>.
							<br />Click the link to activate your account.
						</p>
					</div>
					<div className="flex items-center gap-2 justify-center text-xs text-muted-foreground bg-secondary rounded-lg px-4 py-3">
						<Mail className="h-4 w-4" />
						<span>Didn&apos;t receive it? Check your spam folder.</span>
					</div>
					<Link href="/login">
						<Button variant="outline" className="w-full">
							Back to Sign In
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center px-4 bg-background">
			<div className="w-full max-w-md space-y-8">
				{/* Header */}
				<div className="space-y-4 text-center">
					<Link href="/" className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-primary text-primary-foreground mx-auto">
						<Zap className="h-6 w-6" />
					</Link>
					<div>
						<h1 className="text-3xl font-bold text-foreground">Get Started</h1>
						<p className="text-muted-foreground mt-2">Create your Que account in minutes.</p>
					</div>
				</div>

				{/* Social Auth */}
				<Button
					type="button"
					variant="outline"
					className="w-full h-10"
					onClick={handleGoogleSignIn}
					disabled={googleLoading || loading}
				>
					{googleLoading ? (
						<Loader2 className="h-4 w-4 animate-spin mr-2" />
					) : (
						<GoogleIcon />
					)}
					{googleLoading ? "Redirecting..." : "Continue with Google"}
				</Button>

				<div className="flex items-center gap-3">
					<Separator className="flex-1" />
					<span className="text-xs text-muted-foreground font-medium">or</span>
					<Separator className="flex-1" />
				</div>

				{/* Email/Password Form */}
				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-6">
						{error && (
							<div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-600 text-sm">
								{error}
							</div>
						)}

						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Full Name</FormLabel>
									<FormControl>
										<Input
											type="text"
											placeholder="John Doe"
											className="h-10"
											disabled={loading || googleLoading}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

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
											className="h-10"
											disabled={loading || googleLoading}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder="••••••••"
											className="h-10"
											disabled={loading || googleLoading}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button type="submit" className="w-full h-10" disabled={loading || googleLoading}>
							{loading ? "Creating account..." : "Create Account"}
						</Button>
					</form>
				</Form>

				{/* Sign In Link */}
				<p className="text-center text-sm text-muted-foreground">
					Already have an account?{" "}
					<Link href="/login" className="font-semibold text-primary hover:underline">
						Sign In
					</Link>
				</p>
			</div>
		</div>
	);
}
