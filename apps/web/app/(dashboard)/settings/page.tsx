"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { PageHeader } from "~/components/shared/page-header";
import { toast } from "sonner";

const profileSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email address"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function SettingsPage() {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ProfileFormData>({
		resolver: zodResolver(profileSchema),
		defaultValues: {
			name: "Que User",
			email: "user@example.com",
		},
	});

	const onProfileSubmit = (data: ProfileFormData) => {
		toast.success("Profile updated successfully!");
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title="Settings"
				description="Manage your account preferences, billing, and team members"
			/>

			<Tabs defaultValue="profile" className="space-y-6">
				<TabsList>
					<TabsTrigger value="profile">Profile</TabsTrigger>
					<TabsTrigger value="billing">Billing & Plans</TabsTrigger>
					<TabsTrigger value="team">Team Members</TabsTrigger>
				</TabsList>

				<TabsContent value="profile">
					<form onSubmit={handleSubmit(onProfileSubmit)}>
						<Card>
							<CardHeader>
								<CardTitle>Account Profile</CardTitle>
								<CardDescription>
									Update your public information and email notification preferences
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="name">Full Name</Label>
									<Input id="name" {...register("name")} placeholder="Your name" />
									{errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
								</div>
								<div className="space-y-2">
									<Label htmlFor="email">Email Address</Label>
									<Input id="email" type="email" {...register("email")} placeholder="Your email" />
									{errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
								</div>
							</CardContent>
							<CardFooter>
								<Button type="submit">Save Changes</Button>
							</CardFooter>
						</Card>
					</form>
				</TabsContent>

				<TabsContent value="billing">
					<Card>
						<CardHeader>
							<CardTitle>Billing & Subscriptions</CardTitle>
							<CardDescription>
								View and modify your subscription plan, invoices, and billing history
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between p-4 border rounded-lg bg-muted/40">
								<div>
									<p className="font-semibold">Current Plan: Free Tier</p>
									<p className="text-sm text-muted-foreground">Up to 3 events and 100 responses per event</p>
								</div>
								<Button variant="outline" asChild>
									<Link href="/upgrade">Upgrade Plan</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="team">
					<Card>
						<CardHeader>
							<CardTitle>Team Collaboration</CardTitle>
							<CardDescription>
								Invite other users to collaborate on your events and responses
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="text-sm text-muted-foreground">
								Team sharing is a premium feature. Please upgrade your account to configure teams.
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
