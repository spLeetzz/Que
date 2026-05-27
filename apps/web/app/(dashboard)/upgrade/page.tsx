"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { PageHeader } from "~/components/shared/page-header";
import { CheckIcon } from "lucide-react";
import { toast } from "sonner";

export default function UpgradePage() {
	const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

	const handleCheckout = (planName: string) => {
		toast.success(`Redirecting to payment checkout for the ${planName} plan...`);
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title="Upgrade Your Account"
				description="Choose the plan that fits your growth and collaboration needs"
			/>

			<div className="grid gap-6 md:grid-cols-3">
				{/* Free Plan */}
				<Card className="flex flex-col">
					<CardHeader>
						<CardTitle>Free Tier</CardTitle>
						<CardDescription>Perfect for personal use and small gatherings</CardDescription>
					</CardHeader>
					<CardContent className="flex-1 space-y-4">
						<div className="text-3xl font-bold">
							$0 <span className="text-sm font-normal text-muted-foreground">/ month</span>
						</div>
						<ul className="space-y-2 text-sm">
							<li className="flex items-center gap-2">
								<CheckIcon className="size-4 text-emerald-500" />
								<span>Up to 3 active events</span>
							</li>
							<li className="flex items-center gap-2">
								<CheckIcon className="size-4 text-emerald-500" />
								<span>100 responses per event</span>
							</li>
							<li className="flex items-center gap-2">
								<CheckIcon className="size-4 text-emerald-500" />
								<span>Standard analytics charts</span>
							</li>
						</ul>
					</CardContent>
					<CardFooter>
						<Button variant="outline" className="w-full" disabled>
							Current Plan
						</Button>
					</CardFooter>
				</Card>

				{/* Pro Plan */}
				<Card className="flex flex-col border-primary shadow-lg relative">
					<div className="absolute top-0 right-6 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
						RECOMMENDED
					</div>
					<CardHeader>
						<CardTitle>Pro Plan</CardTitle>
						<CardDescription>For content creators, organizers, and educators</CardDescription>
					</CardHeader>
					<CardContent className="flex-1 space-y-4">
						<div className="text-3xl font-bold">
							$19 <span className="text-sm font-normal text-muted-foreground">/ month</span>
						</div>
						<ul className="space-y-2 text-sm">
							<li className="flex items-center gap-2">
								<CheckIcon className="size-4 text-emerald-500" />
								<span>Unlimited events</span>
							</li>
							<li className="flex items-center gap-2">
								<CheckIcon className="size-4 text-emerald-500" />
								<span>Unlimited responses</span>
							</li>
							<li className="flex items-center gap-2">
								<CheckIcon className="size-4 text-emerald-500" />
								<span>Real-time WebSocket analytics</span>
							</li>
							<li className="flex items-center gap-2">
								<CheckIcon className="size-4 text-emerald-500" />
								<span>Export responses (CSV/JSON)</span>
							</li>
							<li className="flex items-center gap-2">
								<CheckIcon className="size-4 text-emerald-500" />
								<span>Custom slugs & visible branding</span>
							</li>
						</ul>
					</CardContent>
					<CardFooter>
						<Button className="w-full" onClick={() => handleCheckout("Pro")}>
							Upgrade to Pro
						</Button>
					</CardFooter>
				</Card>

				{/* Enterprise Plan */}
				<Card className="flex flex-col">
					<CardHeader>
						<CardTitle>Enterprise</CardTitle>
						<CardDescription>Tailored for large organizations and professional teams</CardDescription>
					</CardHeader>
					<CardContent className="flex-1 space-y-4">
						<div className="text-3xl font-bold">Custom</div>
						<ul className="space-y-2 text-sm">
							<li className="flex items-center gap-2">
								<CheckIcon className="size-4 text-emerald-500" />
								<span>Dedicated support representative</span>
							</li>
							<li className="flex items-center gap-2">
								<CheckIcon className="size-4 text-emerald-500" />
								<span>Multi-user team sharing controls</span>
							</li>
							<li className="flex items-center gap-2">
								<CheckIcon className="size-4 text-emerald-500" />
								<span>SAML SSO authentication</span>
							</li>
							<li className="flex items-center gap-2">
								<CheckIcon className="size-4 text-emerald-500" />
								<span>99.9% uptime SLA guarantee</span>
							</li>
						</ul>
					</CardContent>
					<CardFooter>
						<Button variant="outline" className="w-full" onClick={() => handleCheckout("Enterprise")}>
							Contact Sales
						</Button>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
