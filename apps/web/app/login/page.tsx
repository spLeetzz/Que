"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormValues } from "@repo/auth/validation";
import { authClient } from "~/lib/auth";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Separator } from "~/components/ui/separator";
import { BackgroundImage } from "~/components/features/background-image";
import { Zap, Loader2 } from "lucide-react";

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

export default function LoginPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	const [error, setError] = useState("");

	const form = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: "", password: "" },
	});

	const handleLogin = async (values: LoginFormValues) => {
		setLoading(true);
		setError("");
		const { error: signInError } = await authClient.signIn.email({
			email: values.email,
			password: values.password,
		});
		setLoading(false);
		if (signInError) {
			setError(signInError.message || "Failed to log in");
		} else {
			router.push("/");
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

	return (
		<div className="min-h-screen flex items-center justify-center px-4 bg-background relative">
			<BackgroundImage type="picsum" />
			<div className="w-full max-w-md space-y-8 relative z-10">
				{/* Header */}
				<div className="space-y-4 text-center">
					<Link href="/" className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-primary text-primary-foreground mx-auto">
						<Zap className="h-6 w-6" />
					</Link>
					<div>
						<h1 className="text-3xl font-bold text-foreground">Sign In</h1>
						<p className="text-muted-foreground mt-2">Sign in to your Que account to continue.</p>
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
				<form onSubmit={form.handleSubmit(handleLogin)} className="space-y-6">
					{error && (
						<div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-600 text-sm">
							{error}
						</div>
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
						{loading ? "Signing in..." : "Sign In with Email"}
					</Button>
				</form>
			</Form>

				{/* Sign Up Link */}
				<p className="text-center text-sm text-muted-foreground">
					Don't have an account?{" "}
					<Link href="/signup" className="font-semibold text-primary hover:underline">
						Sign Up
					</Link>
				</p>
			</div>
		</div>
	);
}
