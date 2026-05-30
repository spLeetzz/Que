"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Separator } from "~/components/ui/separator";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import { Loader2, ArrowLeft, FileText, BarChart2, MessageSquare, Globe, Lock, Users, Mail, RefreshCw, Link as LinkIcon, Sparkles } from "lucide-react";
import Link from "next/link";

const EVENT_TYPES = [
  { value: "form", label: "Form", icon: FileText, desc: "Collect structured responses", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { value: "poll", label: "Poll", icon: BarChart2, desc: "Quick opinion voting", color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
  { value: "banter", label: "Banter", icon: MessageSquare, desc: "Live chat room + polls", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
] as const;

export default function CreateEventPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "form" as "form" | "poll" | "banter",
    visibility: "public" as "public" | "private",
    resultVisibility: "all" as "all" | "creator_only",
    mode: "standard" as "standard" | "service",
    authRequired: false,
    multipleResponses: false,
    receiveEmails: false,
    redirectUrl: "",
    slug: "",
  });

  const createMutation = trpc.events.create.useMutation({
    onSuccess: (data) => {
      toast.success("Event created successfully!");
      router.push(`/events/${data.id}/edit`);
    },
    onError: (error) => toast.error(error.message || "Failed to create event"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error("Please enter a title"); return; }
    createMutation.mutate(formData);
  };

  const set = (key: keyof typeof formData, value: any) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl py-10 px-4 space-y-8 animate-in fade-in duration-400">
        {/* Back button */}
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-gradient-to-tr from-primary to-primary/70 flex items-center justify-center shadow-md shadow-primary/20">
              <Sparkles className="size-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Create New Event</h1>
              <p className="text-xs text-muted-foreground">Set up your form, poll, or banter session</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Type Selector */}
          <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4 pt-5 px-5">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Event Type</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-3 gap-3">
                {EVENT_TYPES.map(({ value, label, icon: Icon, desc, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set("type", value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all cursor-pointer ${
                      formData.type === value
                        ? `border-primary bg-primary/5 shadow-sm`
                        : `border-border/50 hover:border-border bg-card hover:bg-secondary/50`
                    }`}
                  >
                    <div className={`size-9 rounded-xl flex items-center justify-center border ${color}`}>
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{label}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{desc}</p>
                    </div>
                    {formData.type === value && (
                      <Badge className="text-[9px] font-bold px-2 rounded-full bg-primary/10 text-primary border-primary/20">Selected</Badge>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4 pt-5 px-5">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm font-semibold">Title <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={e => set("title", e.target.value)}
                  placeholder="Give your event a clear, descriptive name"
                  required
                  className="rounded-xl h-11 border-border/60 focus-visible:ring-primary text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm font-semibold">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => set("description", e.target.value)}
                  placeholder="Briefly describe what this event is about…"
                  rows={3}
                  className="rounded-xl border-border/60 focus-visible:ring-primary text-sm resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-sm font-semibold">Custom Slug <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={e => set("slug", e.target.value)}
                    placeholder="my-cool-event"
                    className="rounded-xl h-11 border-border/60 focus-visible:ring-primary text-sm pl-9"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">Leave empty to auto-generate a slug from the title.</p>
              </div>
            </CardContent>
          </Card>

          {/* Access & Visibility */}
          <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4 pt-5 px-5">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Access & Visibility</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    {formData.visibility === "public" ? <Globe className="size-3.5 text-emerald-500" /> : <Lock className="size-3.5 text-amber-500" />}
                    Visibility
                  </Label>
                  <Select value={formData.visibility} onValueChange={(v: "public" | "private") => set("visibility", v)}>
                    <SelectTrigger className="rounded-xl h-10 border-border/60 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/60">
                      <SelectItem value="public">Public — anyone can see</SelectItem>
                      <SelectItem value="private">Private — link only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Results Visibility</Label>
                  <Select value={formData.resultVisibility} onValueChange={(v: "all" | "creator_only") => set("resultVisibility", v)}>
                    <SelectTrigger className="rounded-xl h-10 border-border/60 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/60">
                      <SelectItem value="all">Everyone can view</SelectItem>
                      <SelectItem value="creator_only">Creator only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Mode</Label>
                <Select value={formData.mode} onValueChange={(v: "standard" | "service") => set("mode", v)}>
                  <SelectTrigger className="rounded-xl h-10 border-border/60 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/60">
                    <SelectItem value="standard">Standard — normal web event</SelectItem>
                    <SelectItem value="service">Service — API / embedded mode</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="redirectUrl" className="text-sm font-semibold">Redirect URL after Submission <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="redirectUrl"
                  type="url"
                  value={formData.redirectUrl}
                  onChange={e => set("redirectUrl", e.target.value)}
                  placeholder="https://example.com/thank-you"
                  className="rounded-xl h-11 border-border/60 focus-visible:ring-primary text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Behavior Toggles */}
          <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4 pt-5 px-5">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Behavior</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-1">
              {[
                { key: "authRequired" as const, icon: Lock, label: "Require Authentication", desc: "Participants must be signed in" },
                { key: "multipleResponses" as const, icon: RefreshCw, label: "Allow Multiple Responses", desc: "Same user can submit more than once" },
                { key: "receiveEmails" as const, icon: Mail, label: "Email Notifications", desc: "Get notified on each new response" },
              ].map(({ key, icon: Icon, label, desc }, i, arr) => (
                <div key={key}>
                  <div className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData[key]}
                      onCheckedChange={v => set(key, v)}
                    />
                  </div>
                  {i < arr.length - 1 && <Separator className="bg-border/40" />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3 pb-8">
            <Button
              type="submit"
              disabled={createMutation.isPending || !formData.title.trim()}
              className="flex-1 h-11 rounded-xl font-semibold shadow-md hover:shadow-lg shadow-primary/10 transition-all"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {createMutation.isPending ? "Creating…" : "Create Event & Continue"}
            </Button>
            <Link href="/dashboard">
              <Button type="button" variant="outline" className="h-11 px-6 rounded-xl font-semibold border-border/60">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
