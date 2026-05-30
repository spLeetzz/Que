"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "~/lib/auth";
import { Button } from "~/components/ui/button";
import { BackgroundImage } from "~/components/features/background-image";
import {
  LogOut,
  LayoutDashboard,
  Zap,
  Users,
  Gauge,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.refresh();
  };

  return (
    <div className="min-h-screen text-foreground relative overflow-hidden">
      <BackgroundImage type="picsum" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm relative">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-90 transition-opacity"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-5 w-5" suppressHydrationWarning />
            </div>
            <span>Que</span>
          </Link>

          <nav className="flex items-center gap-2">
            {isPending ? (
              <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
            ) : session?.user ? (
              <>
                <Link href="/events">
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Log Out</span>
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:py-32 z-10">
        <div className="container mx-auto max-w-5xl">
          <div className="space-y-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
              <Zap className="h-3 w-3" suppressHydrationWarning />
              Interactive Forms, Polls & Real-Time Chat
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
                Create Interactive Forms & Polls in Seconds
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Build beautiful forms, conduct instant polls, and engage participants with real-time
                chat rooms. No coding required.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-4">
              {session?.user ? (
                <Link href="/events">
                  <Button size="lg" className="h-11 px-8">
                    Start Now
                    <ChevronRight />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup">
                    <Button size="lg" className="h-11 px-8">
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="h-11 px-8">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t py-16 px-4 sm:py-24 bg-secondary/80 relative z-5">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Powerful Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create engaging interactive experiences
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <MessageSquare className="h-6 w-6" suppressHydrationWarning />,
                title: "Live Chat Rooms",
                description:
                  "Create real-time banter rooms for participants to engage and discuss results instantly.",
              },
              {
                icon: <Users className="h-6 w-6" suppressHydrationWarning />,
                title: "Instant Engagement",
                description:
                  "Watch responses populate live on your dashboard. Real-time participation tracking.",
              },
              {
                icon: <Gauge className="h-6 w-6" suppressHydrationWarning />,
                title: "Smart Analytics",
                description:
                  "Get instant insights with beautiful analytics dashboards and response visualizations.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="space-y-4 p-6 rounded-lg border border-border bg-card hover:shadow-sm transition-shadow"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:py-24 relative z-10">
        <div className="container mx-auto max-w-3xl text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Ready to engage your audience?
          </h2>
          <p className="text-muted-foreground text-lg">
            Start creating interactive forms and polls today. No credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="h-11 px-8">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-11 px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Zap className="h-4 w-4" suppressHydrationWarning />
            Que
          </div>
          <p>© Que. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
