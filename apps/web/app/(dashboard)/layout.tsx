"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	BarChart3Icon,
	CalendarIcon,
	CreditCardIcon,
	SettingsIcon,
} from "lucide-react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from "~/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";

const navigationItems = [
	{
		title: "Events",
		href: "/events",
		icon: CalendarIcon,
	},
	{
		title: "Analytics",
		href: "/analytics",
		icon: BarChart3Icon,
	},
	{
		title: "Settings",
		href: "/settings",
		icon: SettingsIcon,
	},
	{
		title: "Upgrade",
		href: "/upgrade",
		icon: CreditCardIcon,
	},
];

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<SidebarProvider>
			<Sidebar>
				<SidebarHeader>
					<div className="flex items-center gap-2 px-2 py-2">
						<div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
							<span className="text-lg font-bold">Q</span>
						</div>
						<div className="flex flex-col">
							<span className="text-sm font-semibold">Que</span>
							<span className="text-xs text-muted-foreground">
								Event Management
							</span>
						</div>
					</div>
				</SidebarHeader>

				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarMenu>
								{navigationItems.map((item) => {
									const isActive = pathname === item.href;
									return (
										<SidebarMenuItem key={item.href}>
											<SidebarMenuButton asChild isActive={isActive}>
												<Link href={item.href}>
													{mounted ? <item.icon /> : <div className="size-6 shrink-0" />}
													<span>{item.title}</span>
												</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
									);
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>

				<SidebarFooter>
					<SidebarMenu>
						<SidebarMenuItem>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										className="w-full justify-start gap-2 px-2"
									>
										<Avatar className="size-8">
											<AvatarImage src="" alt="User" />
											<AvatarFallback>U</AvatarFallback>
										</Avatar>
										<div className="flex flex-col items-start text-left">
											<span className="text-sm font-medium">User</span>
											<span className="text-xs text-muted-foreground">
												user@example.com
											</span>
										</div>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-56">
									<DropdownMenuLabel>My Account</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem asChild>
										<Link href="/settings">Settings</Link>
									</DropdownMenuItem>
									<DropdownMenuItem>Support</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem>Log out</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarFooter>
			</Sidebar>

			<SidebarInset>
				<header className="flex h-14 items-center gap-2 border-b px-4">
					{mounted && <SidebarTrigger />}
				</header>
				<div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
