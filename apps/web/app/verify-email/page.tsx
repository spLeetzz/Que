"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "~/lib/auth";
import { Button } from "~/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { LoadingSpinner } from "~/components/shared/loading-spinner";

function VerifyEmailContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const token = searchParams.get("token");

	const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
	const [error, setError] = useState("");

	useEffect(() => {
		if (!token) {
			setStatus("error");
			setError("Missing email verification token in URL");
			return;
		}

		authClient.verifyEmail({
			query: { token }
		})
		.then(({ error: verifyError }) => {
			if (verifyError) {
				setStatus("error");
				setError(verifyError.message || "Failed to verify email");
			} else {
				setStatus("success");
				setTimeout(() => router.push("/"), 2000);
			}
		})
		.catch((err) => {
			setStatus("error");
			setError(err instanceof Error ? err.message : "Unexpected verification error");
		});
	}, [token, router]);

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Email Verification</CardTitle>
					<CardDescription>
						{status === "loading" && "Verifying your email address..."}
						{status === "success" && "Your email has been verified! Redirecting..."}
						{status === "error" && (
							<span className="text-destructive">{error}</span>
						)}
					</CardDescription>
				</CardHeader>
				{status === "error" && (
					<CardFooter className="justify-center">
						<Link href="/login">
							<Button variant="outline">Go to Login</Button>
						</Link>
					</CardFooter>
				)}
			</Card>
		</div>
	);
}

export default function VerifyEmailPage() {
	return (
		<Suspense fallback={<div className="flex min-h-screen items-center justify-center"><LoadingSpinner /></div>}>
			<VerifyEmailContent />
		</Suspense>
	);
}
