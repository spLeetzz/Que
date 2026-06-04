"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent } from "~/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowLeft, FileText, BarChart2, MessageSquare, Sparkles } from "lucide-react";
import Link from "next/link";

const EVENT_TYPES = [
  { value: "form", label: "Form", icon: FileText, desc: "Collect responses", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { value: "poll", label: "Poll", icon: BarChart2, desc: "Quick voting", color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
  { value: "banter", label: "Banter", icon: MessageSquare, desc: "Live chat", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
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
      toast.success("Event created!");
      router.push(`/events/${data.slug || data.id}?tab=manage`);
    },
    onError: (error) => toast.error(error.message || "Failed to create event"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error("Please enter a title"); return; }
    const { redirectUrl, slug, receiveEmails, ...rest } = formData;
    const canEmail = (formData.type === "form" || formData.type === "poll") && formData.authRequired;
    createMutation.mutate({
      ...rest,
      slug: slug.trim() || null,
      redirectUrl: redirectUrl.trim() || null,
      receiveEmails: canEmail ? receiveEmails : false,
    });
  };

  const set = (key: keyof typeof formData, value: any) =>
    setFormData(prev => {
      const next = { ...prev, [key]: value };
      if (key === "authRequired" && !value) next.receiveEmails = false;
      if (key === "type" && value === "banter") next.receiveEmails = false;
      return next;
    });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl py-8 px-4 space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()} 
            className="rounded-full size-10 hover:bg-secondary shrink-0 text-muted-foreground hover:text-foreground"
            title="Go back"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-tr from-primary to-primary/70 flex items-center justify-center shadow-md shadow-primary/20">
              <Sparkles className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Create Event</h1>
              <p className="text-xs text-muted-foreground">Quick setup in one screen</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Single compact card */}
          <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6 space-y-5">
              {/* Event Type - Horizontal compact */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {EVENT_TYPES.map(({ value, label, icon: Icon, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set("type", value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                        formData.type === value
                          ? `border-primary bg-primary/5 shadow-sm`
                          : `border-border/50 hover:border-border bg-card`
                      }`}
                    >
                      <div className={`size-7 rounded-lg flex items-center justify-center border ${color}`}>
                        <Icon className="size-3.5" />
                      </div>
                      <p className="font-bold text-xs">{label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm font-semibold">Title <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={e => set("title", e.target.value)}
                  placeholder="My awesome event"
                  required
                  autoFocus
                  className="rounded-xl h-10 border-border/60 text-sm"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm font-semibold">Description <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => set("description", e.target.value)}
                  placeholder="What's this about?"
                  rows={2}
                  className="rounded-xl border-border/60 text-sm resize-none"
                />
              </div>

              {/* Quick settings in 2 columns */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Visibility</Label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => set("visibility", "public")}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        formData.visibility === "public"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border/50 text-muted-foreground hover:border-border"
                      }`}
                    >
                      Public
                    </button>
                    <button
                      type="button"
                      onClick={() => set("visibility", "private")}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        formData.visibility === "private"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border/50 text-muted-foreground hover:border-border"
                      }`}
                    >
                      Private
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Results</Label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => set("resultVisibility", "all")}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        formData.resultVisibility === "all"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border/50 text-muted-foreground hover:border-border"
                      }`}
                    >
                      Public
                    </button>
                    <button
                      type="button"
                      onClick={() => set("resultVisibility", "creator_only")}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        formData.resultVisibility === "creator_only"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border/50 text-muted-foreground hover:border-border"
                      }`}
                    >
                      Private
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={createMutation.isPending || !formData.title.trim()}
              className="flex-1 h-11 rounded-xl font-semibold shadow-md hover:shadow-lg shadow-primary/10 transition-all"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {createMutation.isPending ? "Creating…" : "Create & Continue"}
            </Button>
            <Button type="button" onClick={() => router.back()} variant="outline" className="h-11 px-6 rounded-xl font-semibold border-border/60">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
