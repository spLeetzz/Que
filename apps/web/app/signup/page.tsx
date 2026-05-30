"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignUpFormValues } from "@repo/auth/validation";
import { authClient } from "~/lib/auth";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Separator } from "~/components/ui/separator";
import { Sparkles, ArrowRight, CheckCircle2, Mail, Zap, Shield, Globe } from "lucide-react";

function GoogleIcon() {
	const [mounted, setMounted] = useState(false);
	useEffect(() => { setMounted(true); }, []);
	if (!mounted) return <div className="size-4 shrink-0" />;
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
			<div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
				<div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-emerald-500/8 blur-3xl -z-10" />
				<div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl -z-10" />
				<div className="w-full max-w-sm space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
					<div className="size-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
						<CheckCircle2 className="size-10 text-emerald-500" />
					</div>
					<div className="space-y-2">
						<h1 className="text-2xl font-extrabold tracking-tight text-foreground">Check your inbox</h1>
						<p className="text-sm text-muted-foreground leading-relaxed">
							We&apos;ve sent a verification link to{" "}
							<span className="font-semibold text-foreground">{emailValue}</span>.
							<br />Click the link to activate your account.
						</p>
					</div>
					<div className="flex items-center gap-2 justify-center text-xs text-muted-foreground bg-secondary/50 border border-border/40 rounded-xl px-4 py-3">
						<Mail className="size-3.5 shrink-0" />
						<span>Didn&apos;t receive it? Check your spam folder.</span>
					</div>
					<Link href="/login">
						<Button variant="outline" className="w-full rounded-xl h-11 font-semibold border-border/60">
							Back to Sign In
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex">
			{/* Left brand panel */}
			<div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-10 bg-gradient-to-br from-primary/90 via-primary to-indigo-600 overflow-hidden">
				<div className="absolute inset-0 opacity-[0.07]" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")"}} />
				<div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
				<div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-400/20 blur-3xl" />

				<div className="relative z-10">
					<div className="flex items-center gap-2.5">
						<div className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
							<Sparkles className="size-5 text-white" />
						</div>
						<span className="text-xl font-bold text-white tracking-tight">Que Platform</span>
					</div>
				</div>

				<div className="relative z-10 space-y-8">
					<div className="space-y-3">
						<h2 className="text-3xl font-extrabold text-white leading-tight">
							Start for free.<br />Build something real.
						</h2>
						<p className="text-white/70 text-sm leading-relaxed">
							Join thousands of creators already building interactive experiences with Que.
						</p>
					</div>

					<div className="space-y-3">
						{[
							{ icon: Zap, label: "No setup required", desc: "Launch in under 60 seconds" },
							{ icon: Shield, label: "Private by default", desc: "Control who sees your events" },
							{ icon: Globe, label: "Share anywhere", desc: "One link, any device" },
						].map(({ icon: Icon, label, desc }) => (
							<div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
								<div className="size-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
									<Icon className="size-4 text-white" />
								</div>
								<div>
									<p className="text-white text-sm font-semibold">{label}</p>
									<p className="text-white/60 text-xs">{desc}</p>
								</div>
							</div>
						))}
					</div>
				</div>

				<p className="relative z-10 text-white/40 text-xs">© 2026 Que Platform Inc.</p>
			</div>

			{/* Right auth panel */}
			<div className="flex-1 flex items-center justify-center p-6 bg-background relative overflow-hidden">
				<div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/5 blur-3xl -z-10" />
				<div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl -z-10" />

				<div className="w-full max-w-sm space-y-7">
					<div className="flex items-center gap-2 lg:hidden">
						<div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
							<Sparkles className="size-4" />
						</div>
						<span className="font-bold text-lg tracking-tight">Que Platform</span>
					</div>

					<div className="space-y-1">
						<h1 className="text-2xl font-extrabold tracking-tight text-foreground">Create your account</h1>
						<p className="text-sm text-muted-foreground">Free forever. No credit card needed.</p>
					</div>

					<div className="space-y-4">
						<Button
							id="google-sign-up"
							variant="outline"
							size="lg"
							className="w-full rounded-xl border-border/60 h-11 font-semibold gap-2.5 hover:bg-secondary transition-all"
							onClick={handleGoogleSignIn}
							disabled={googleLoading}
						>
							<GoogleIcon />
							{googleLoading ? "Redirecting..." : "Continue with Google"}
						</Button>

						<div className="flex items-center gap-3">
							<Separator className="flex-1 bg-border/40" />
							<span className="text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">or</span>
							<Separator className="flex-1 bg-border/40" />
						</div>

						<Form {...form}>
							<form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-4">
								{error && (
									<div className="text-destructive text-sm text-center bg-destructive/8 border border-destructive/20 rounded-xl px-4 py-3 font-medium">
										{error}
									</div>
								)}
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-sm font-semibold text-foreground">Full Name</FormLabel>
											<FormControl>
												<Input
													placeholder="Alex Johnson"
													autoComplete="name"
													className="rounded-xl h-11 border-border/60 bg-background focus-visible:ring-primary text-sm"
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
											<FormLabel className="text-sm font-semibold text-foreground">Work Email</FormLabel>
											<FormControl>
												<Input
													type="email"
													placeholder="you@company.com"
													autoComplete="email"
													className="rounded-xl h-11 border-border/60 bg-background focus-visible:ring-primary text-sm"
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
											<FormLabel className="text-sm font-semibold text-foreground">Password</FormLabel>
											<FormControl>
												<Input
													type="password"
													placeholder="Create a strong password"
													autoComplete="new-password"
													className="rounded-xl h-11 border-border/60 bg-background focus-visible:ring-primary text-sm"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<Button
									id="signup-submit"
									type="submit"
									size="lg"
									className="w-full h-11 rounded-xl font-semibold shadow-md hover:shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all group"
									disabled={loading}
								>
									{loading ? "Creating account..." : (
										<>
											Get Started Free
											<ArrowRight className="size-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
										</>
									)}
								</Button>
							</form>
						</Form>
					</div>

					<p className="text-center text-muted-foreground text-sm">
						Already have an account?{" "}
						<Link href="/login" className="text-primary font-semibold hover:text-primary/80 transition-colors">
							Sign in
						</Link>
					</p>

					<p className="text-center text-xs text-muted-foreground/60">
						By signing up, you agree to our Terms of Service and Privacy Policy.
					</p>
				</div>
			</div>
		</div>
	);
}
