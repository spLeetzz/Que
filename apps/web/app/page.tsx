"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type ChangePasswordFormValues, resetPasswordSchema, type ResetPasswordFormValues } from "@repo/auth/validation";
import { authClient } from "~/lib/auth";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { 
  KeyRound, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Activity, 
  Sparkles, 
  User, 
  Mail,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  Image as ImageIcon,
  Flame,
  LayoutDashboard,
  Check
} from "lucide-react";

const DEMO_IMAGES = [
  "https://images.unsplash.com/featured/800x600/?ocean,beach",
  "https://images.unsplash.com/featured/800x600/?forest,fog",
  "https://images.unsplash.com/featured/800x600/?stars,galaxy",
  "https://images.unsplash.com/featured/800x600/?cyberpunk,tech",
  "https://images.unsplash.com/featured/800x600/?abstract,gradient",
];

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  // Dynamic Background Image Carousel for Landing Page Form Mockup
  const [bgImageIndex, setBgImageIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Background transition interval
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setBgImageIndex((prev) => (prev + 1) % DEMO_IMAGES.length);
        setFade(true);
      }, 300);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const { data: session, isPending } = authClient.useSession();
  const { data: healthData } = trpc.health.getHealth.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (session?.user) {
      authClient.listAccounts()
        .then((res) => {
          if (res.data) {
            setAccounts(res.data);
          }
        })
        .catch((err) => {
          console.error("Failed to list accounts", err);
        });
    } else {
      setAccounts([]);
    }
  }, [session?.user, changePasswordOpen]);

  const hasPasswordLinked = accounts.some(
    (acc) => acc.providerId === "credential" || acc.providerId === "password"
  );

  const changeForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const setForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  const handleSignOut = async () => {
    await authClient.signOut();
    router.refresh();
  };

  const handlePasswordChange = async (values: ChangePasswordFormValues) => {
    setLoading(true);
    setError("");
    setSuccess(false);

    const { error: changeError } = await authClient.changePassword({
      newPassword: values.newPassword,
      currentPassword: values.currentPassword,
      revokeOtherSessions: true,
    });

    setLoading(true); // Wait a bit for UX

    const timer = setTimeout(() => {
      setLoading(false);
      if (changeError) {
        setError(changeError.message || "Failed to change password.");
      } else {
        setSuccess(true);
        changeForm.reset();
        setTimeout(() => {
          setChangePasswordOpen(false);
          setSuccess(false);
        }, 2000);
      }
    }, 500);
  };

  const handlePasswordSet = async (values: ResetPasswordFormValues) => {
    setLoading(true);
    setError("");
    setSuccess(false);

    const { error: setErrorResult } = await (authClient as any).setPassword({
      newPassword: values.password,
    });

    setLoading(false);

    if (setErrorResult) {
      setError(setErrorResult.message || "Failed to set password.");
    } else {
      setSuccess(true);
      setForm.reset();
      authClient.listAccounts().then((res) => {
        if (res.data) setAccounts(res.data);
      });
      setTimeout(() => {
        setChangePasswordOpen(false);
        setSuccess(false);
      }, 2000);
    }
  };

  if (!mounted) {
    return null;
  }

  const isServerHealthy = !!healthData?.status;

  return (
    <div className="min-h-screen bg-linear-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100 selection:bg-primary/30 font-sans">
      
      {/* Premium Glassmorphic Header */}
      <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight transition hover:opacity-90">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-tr from-primary to-indigo-500 shadow-lg shadow-primary/20">
              <Sparkles className="h-5 w-5 text-neutral-950" />
            </div>
            <span className="bg-linear-to-r from-white to-neutral-400 bg-clip-text text-transparent">Que</span>
          </Link>

          <div className="flex items-center gap-3">
            {isPending ? (
              <div className="h-9 w-20 animate-pulse rounded-lg bg-neutral-800" />
            ) : session?.user ? (
              <div className="flex items-center gap-3">
                <span className="hidden text-neutral-400 text-xs sm:inline-block">
                  Hello, <strong className="text-neutral-200">{session.user.name}</strong>
                </span>
                <Link href="/events">
                  <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs border-neutral-800">
                    <LayoutDashboard className="size-3.5" />
                    <span>Dashboard</span>
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="h-8 text-xs text-neutral-400 hover:text-white">
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Log Out</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-xs h-8">
                    <span>Log In</span>
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="text-xs h-8 bg-white hover:bg-neutral-200 text-neutral-950 font-bold transition-all shadow-md">
                    <span>Get Started</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 px-4 border-b border-neutral-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.18),rgba(255,255,255,0))]">
        <div className="container mx-auto max-w-5xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/5 px-4 py-1 text-xs text-indigo-400 font-semibold animate-pulse">
            <Flame className="size-3.5 text-primary" />
            <span>Interactive SaaS Forms Redefined</span>
          </div>

          <h2 className="text-sm font-extrabold uppercase tracking-widest text-primary/70">
            Ever wanted a place to settle your WhatsApp group fights?
          </h2>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] bg-linear-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            Meet Banter & Custom Forms. <br className="hidden md:inline" />
            Build, Poll, and Settle Debates.
          </h1>

          <p className="max-w-2xl mx-auto text-muted-foreground text-sm sm:text-base leading-relaxed">
            Create highly interactive forms, conduct lightning-fast decision polls, and open beautiful instant real-time <strong>Banter Chat Rooms</strong> to spark live participant engagement.
          </p>

          <div className="flex flex-wrap justify-center gap-3.5 pt-4">
            {session?.user ? (
              <Link href="/events">
                <Button size="lg" className="h-11 px-8 bg-primary hover:bg-primary/90 text-neutral-950 font-bold rounded-xl transition-all shadow-lg hover:shadow-primary/10">
                  Go to Creator Workspace
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="h-11 px-8 bg-white hover:bg-neutral-200 text-neutral-950 font-black rounded-xl transition-all shadow-lg">
                    Build Your First Poll
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="h-11 px-8 rounded-xl border-neutral-800 hover:bg-neutral-900 font-semibold">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Main SaaS Details & Onboarding Mockup Grid */}
      <section className="container mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 md:grid-cols-2 items-center">
          
          {/* Feature details column */}
          <div className="space-y-8">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Features & Capabilities</h3>
              <h2 className="text-3xl font-black tracking-tight mt-2 text-white leading-tight">
                Not your average survey tool. Made for fast-paced interaction.
              </h2>
            </div>

            <div className="space-y-6">
              {/* Feature 1 */}
              <div className="flex gap-4 items-start">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <MessageSquare className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-neutral-100">Live Banter Rooms</h4>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Settle those heated arguments right on the spot! Link a banter session directly to your poll so participants can debate, send instant responses, and banter in real time.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex gap-4 items-start">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <ImageIcon className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-neutral-100">Premium Unsplash Image Themes</h4>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Style your forms instantly! Connect custom premium Unsplash backgrounds via query search that are token-free and load lightning-fast for maximum participant completion rates.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex gap-4 items-start">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-neutral-100">Real-Time State Presence</h4>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Watch responses populate live on your analytics dashboard. Keep track of exactly how many participants are filling out questions as it happens.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Mockup Preview Form Column */}
          <div className="relative flex justify-center">
            {/* The outer styled display form mockup whose background transitions dynamically */}
            <div 
              style={{ 
                backgroundImage: `url(${DEMO_IMAGES[bgImageIndex]})`,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
              className={`w-full max-w-[400px] h-[480px] rounded-3xl relative overflow-hidden shadow-2xl border border-neutral-800/50 flex flex-col justify-between p-6 transition-all duration-700 ${
                fade ? "opacity-100 scale-100" : "opacity-90 scale-[0.99]"
              }`}
            >
              {/* Blur backdrop overlay */}
              <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-all pointer-events-none" />

              {/* Mockup Header */}
              <div className="relative z-10 flex justify-between items-center bg-black/20 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10 text-xs">
                <span className="font-bold text-white flex items-center gap-1">
                  <Sparkles className="size-3 text-primary" /> Previewing Theme Live
                </span>
                <span className="text-[10px] text-neutral-300 font-semibold uppercase">Type: Poll</span>
              </div>

              {/* Mockup Form Content */}
              <div className="relative z-10 bg-black/60 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center space-y-4 shadow-xl">
                <HelpCircle className="size-10 text-primary mx-auto animate-bounce" />
                <h4 className="font-extrabold text-sm text-white">Where should we go for our weekend road trip?</h4>
                <div className="space-y-2">
                  <button type="button" className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-left px-3 text-white flex justify-between items-center transition-all">
                    <span>🌴 Mountain Cabin Getaway</span>
                    <span className="text-[10px] text-neutral-400 font-semibold">45%</span>
                  </button>
                  <button type="button" className="w-full py-2.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-xs text-left px-3 text-white flex justify-between items-center transition-all">
                    <span className="flex items-center gap-1.5">🏄 Sunset Beach House <Check className="size-3 text-primary" /></span>
                    <span className="text-[10px] text-primary font-bold">55%</span>
                  </button>
                </div>
              </div>

              {/* Mockup Info footer */}
              <div className="relative z-10 text-center bg-black/50 backdrop-blur-md py-2 rounded-xl text-[10px] text-neutral-300 border border-white/5">
                Background Theme Powered by <strong>Unsplash API</strong>
              </div>
            </div>

            {/* Glowing background circles for visual depth */}
            <div className="absolute -left-12 -bottom-12 -z-10 size-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -right-12 -top-12 -z-10 size-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          </div>

        </div>
      </section>

      {/* Profile & Settings Admin Section */}
      {session?.user && (
        <section className="container mx-auto max-w-6xl px-4 py-10 sm:px-6 border-t border-neutral-900">
          <div className="grid gap-6 md:grid-cols-3">
            
            {/* Health Info */}
            <Card className="border-neutral-800 bg-neutral-900/40 backdrop-blur-xs">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4 text-indigo-400" />
                  <span>Platform Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950/50 p-3">
                  <span className="text-neutral-400 text-xs">API Backend Status</span>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-neutral-300">ONLINE</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Info */}
            <Card className="border-neutral-800 bg-neutral-900/40 backdrop-blur-xs">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-primary" />
                  <span>Account Email</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950/50 p-3 truncate">
                  <Mail className="size-3.5 text-neutral-500 shrink-0" />
                  <span className="text-xs font-semibold text-neutral-300 truncate">{session.user.email}</span>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="border-neutral-800 bg-neutral-900/40 backdrop-blur-xs flex flex-col justify-center">
              <CardContent className="pt-6">
                <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full gap-2 border-neutral-800 hover:bg-neutral-800 hover:text-white h-9 text-xs">
                      <KeyRound className="h-4 w-4 text-neutral-400" />
                      <span>{hasPasswordLinked ? "Change Password" : "Set Account Password"}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                    <DialogHeader>
                      <DialogTitle className="text-xl">
                        {hasPasswordLinked ? "Change Password" : "Set Account Password"}
                      </DialogTitle>
                      <DialogDescription className="text-neutral-400">
                        {hasPasswordLinked 
                          ? "Update your account password safely." 
                          : "Configure a secure password to log in directly."
                        }
                      </DialogDescription>
                    </DialogHeader>

                    {success ? (
                      <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
                        <CheckCircle2 className="h-12 w-12 text-emerald-400 animate-bounce" />
                        <h4 className="font-semibold text-lg text-emerald-400">
                          Password updated successfully!
                        </h4>
                      </div>
                    ) : hasPasswordLinked ? (
                      <Form {...changeForm}>
                        <form onSubmit={changeForm.handleSubmit(handlePasswordChange)} className="flex flex-col gap-4 py-2">
                          {error && (
                            <p className="text-rose-400 text-xs text-center font-medium bg-rose-950/20 border border-rose-900/30 rounded-lg p-2.5">
                              {error}
                            </p>
                          )}
                          
                          <FormField
                            control={changeForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-neutral-300">Current Password</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="border-neutral-800 bg-neutral-900 focus-visible:ring-primary h-9 text-sm"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={changeForm.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-neutral-300">New Password</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="border-neutral-800 bg-neutral-900 focus-visible:ring-primary h-9 text-sm"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <DialogFooter className="mt-4">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setChangePasswordOpen(false)}
                              disabled={loading}
                              className="h-9 text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={loading}
                              className="h-9 text-xs bg-primary hover:bg-primary/95 text-neutral-950 font-bold"
                            >
                              {loading ? "Updating..." : "Save Password"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    ) : (
                      <Form {...setForm}>
                        <form onSubmit={setForm.handleSubmit(handlePasswordSet)} className="flex flex-col gap-4 py-2">
                          {error && (
                            <p className="text-rose-400 text-xs text-center font-medium bg-rose-950/20 border border-rose-900/30 rounded-lg p-2.5">
                              {error}
                            </p>
                          )}

                          <FormField
                            control={setForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-neutral-300">Choose Password</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="border-neutral-800 bg-neutral-900 focus-visible:ring-primary h-9 text-sm"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <DialogFooter className="mt-4">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setChangePasswordOpen(false)}
                              disabled={loading}
                              className="h-9 text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={loading}
                              className="h-9 text-xs bg-primary hover:bg-primary/95 text-neutral-950 font-bold"
                            >
                              {loading ? "Setting Password..." : "Set Password"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

          </div>
        </section>
      )}

      {/* Sleek Footer */}
      <footer className="mt-20 border-t border-neutral-900 py-12 text-center text-muted-foreground text-xs bg-black/40">
        <p className="font-semibold text-neutral-400">© 2026 Que Interactive Inc. All rights reserved.</p>
        <p className="mt-1.5 text-neutral-600">Built with next-generation Next.js, tRPC, Drizzle PG & Unsplash Custom Engine.</p>
      </footer>
    </div>
  );
}
