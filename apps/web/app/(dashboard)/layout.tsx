"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3Icon,
  CalendarIcon,
  CreditCardIcon,
  SettingsIcon,
  LogOut,
  User,
} from "lucide-react";
import { BackgroundImage } from "~/components/features/background-image";
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
import { authClient } from "~/lib/auth";
import { toast } from "sonner";

const navigationItems = [
  { title: "Dashboard", href: "/dashboard", icon: BarChart3Icon },
  { title: "Events", href: "/events", icon: CalendarIcon },
  { title: "Analytics", href: "/analytics", icon: BarChart3Icon },
  { title: "Settings", href: "/settings", icon: SettingsIcon },
  { title: "Upgrade", href: "/upgrade", icon: CreditCardIcon },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  const user = session?.user;
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      router.push("/login");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-border/50 shadow-sm shadow-black/5 bg-background/90 backdrop-blur-md">
        <SidebarHeader className="border-b border-border/40 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20 transition-transform duration-300 hover:scale-75">
              <span className="text-l font-semibold tracking-tight">Que</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-foreground">
                Que Platform
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-primary/80 pt-1">
                SaaS Console
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-4">
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={`relative rounded-xl px-3 py-2.5 transition-all duration-200 group ${isActive
                          ? "bg-primary/10 text-primary font-semibold shadow-sm"
                          : "hover:bg-secondary hover:text-foreground text-muted-foreground"
                          }`}
                      >
                        <Link href={item.href} className="flex items-center gap-3">
                          {mounted ? (
                            <item.icon
                              className={`size-4.5 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-primary" : "text-muted-foreground/80"}`}
                            />
                          ) : (
                            <div className="size-4.5 shrink-0" />
                          )}
                          <span className="text-sm tracking-wide">{item.title}</span>
                          {isActive && (
                            <div className="absolute left-0 top-1/4 h-1/2 w-1 rounded-r-full bg-primary" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-border/40 p-3 bg-secondary/30">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 px-3 h-auto py-2 rounded-xl hover:bg-secondary border border-transparent hover:border-border/30 transition-all duration-300"
                  >
                    <Avatar className="size-8.5 border border-border shadow-sm">
                      <AvatarImage src={user?.isAnonymous ? "" : (user?.image ?? "")} alt={user?.isAnonymous ? "Guest" : (user?.name || "")} />
                      <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                        {mounted ? (user?.isAnonymous ? "G" : initials) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left min-w-0">
                      <span className="text-sm font-semibold truncate max-w-[130px] text-foreground">
                        {mounted ? (user?.isAnonymous ? "Guest" : (user?.name || "User")) : "User"}
                      </span>
                      {(!user?.isAnonymous) && (
                        <span className="text-[10px] text-muted-foreground truncate max-w-[130px] font-mono">
                          {mounted ? user?.email || "" : ""}
                        </span>
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-xl shadow-lg border border-border/60"
                >
                  <DropdownMenuLabel className="px-3 py-2 border-b border-border/40">
                    <p className="text-sm font-semibold text-foreground">
                      {user?.isAnonymous ? "Guest Session" : (user?.name || "My Account")}
                    </p>
                    {!user?.isAnonymous && (
                      <p className="text-xs text-muted-foreground font-normal truncate font-mono">
                        {user?.email}
                      </p>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-1" />

                  {user?.isAnonymous ? (
                    <DropdownMenuItem asChild className="rounded-lg m-1 px-3 py-2 cursor-pointer bg-primary/10 text-primary focus:bg-primary/20 focus:text-primary font-medium">
                      <Link href="/login" className="flex items-center gap-2">
                        <User className="h-4 w-4" />{" "}
                        <span className="text-balance">Sign in to save your progress</span>
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild className="rounded-lg m-1 px-3 py-2 cursor-pointer">
                      <Link href="/settings" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />{" "}
                        <span>Profile & Settings</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="rounded-lg m-1 px-3 py-2 text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" /> <span>{user?.isAnonymous ? "Leave Session" : "Log out"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="relative bg-background">
        <BackgroundImage type="picsum" />
        <header className="flex h-14 items-center justify-between gap-4 border-b border-border/45 px-6 bg-background/80 backdrop-blur-md sticky top-0 z-50 relative">
          <div className="flex items-center gap-3">
            {mounted && (
              <SidebarTrigger className="hover:bg-secondary rounded-lg p-1.5 transition-colors border border-border/30 shadow-sm" />
            )}
            <div className="h-4 w-[1px] bg-border/60" />
            <span className="text-[10px] font-semibold text-primary uppercase font-mono tracking-wider bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              Production Console
            </span>
          </div>
          <div className="flex items-center gap-3">{/* Extra header utilities */}</div>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-6 md:p-8 max-w-7xl w-full mx-auto relative z-10 min-h-screen">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
