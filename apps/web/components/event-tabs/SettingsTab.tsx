"use client";

import { useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import {
  Save,
  CheckCircle,
  Archive,
  Trash2,
  Copy,
  Zap,
  PlayCircle,
  PauseCircle,
  Settings,
} from "lucide-react";
import { getEventTabPath } from "~/lib/event-paths";
import { EventSettingsForm } from "~/components/features/event-settings-form";

interface SettingsTabProps {
  event: any;
  eventId: string;
}

export function SettingsTab({ event, eventId }: SettingsTabProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const publishMutation = trpc.events.publish.useMutation({
    onSuccess: () => {
      toast.success("Event published! It's now live.");
      utils.events.getByIdOrSlug.invalidate({ identifier: eventId });
    },
    onError: (error) => toast.error(error.message || "Failed to publish event"),
  });

  const unpublishMutation = trpc.events.unpublish.useMutation({
    onSuccess: () => {
      toast.success("Event unpublished. Moved back to draft.");
      utils.events.getByIdOrSlug.invalidate({ identifier: eventId });
    },
    onError: (error) => toast.error(error.message || "Failed to unpublish event"),
  });

  const archiveMutation = trpc.events.archive.useMutation({
    onSuccess: () => {
      toast.success("Event archived.");
      router.push("/dashboard");
    },
    onError: (error) => toast.error(error.message || "Failed to archive event"),
  });

  const completeMutation = trpc.events.complete.useMutation({
    onSuccess: () => {
      toast.success("Event marked as completed!");
      utils.events.getByIdOrSlug.invalidate({ identifier: eventId });
    },
    onError: (error) => toast.error(error.message || "Failed to complete event"),
  });

  const deleteMutation = trpc.events.delete.useMutation({
    onSuccess: () => {
      toast.success("Event deleted.");
      router.push("/dashboard");
    },
    onError: (error) => toast.error(error.message || "Failed to delete event"),
  });

  const duplicateMutation = trpc.events.duplicate.useMutation({
    onSuccess: (data) => {
      toast.success("Event duplicated!");
      router.push(getEventTabPath(data, "manage"));
    },
    onError: (error) => toast.error(error.message || "Failed to duplicate event"),
  });

  const getStatusBadge = () => {
    const s = event.status;
    if (s === "published")
      return (
        <Badge className="rounded-full px-3 text-[10px] font-bold uppercase bg-green-500/10 text-green-500 border border-green-500/20">
          Live
        </Badge>
      );
    if (s === "completed")
      return (
        <Badge className="rounded-full px-3 text-[10px] font-bold uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20">
          Completed
        </Badge>
      );
    if (s === "archived")
      return (
        <Badge className="rounded-full px-3 text-[10px] font-bold uppercase bg-slate-500/10 text-slate-500 border border-slate-500/20">
          Archived
        </Badge>
      );
    return (
      <Badge className="rounded-full px-3 text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
        Draft
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-xl font-bold tracking-tight">Event Settings & Lifecycle</h3>
        <p className="text-sm text-muted-foreground">
          Manage event status, configuration, and advanced settings. Changes are saved
          automatically.
        </p>
      </div>
      <div className="pt-2 space-y-6">
        {/* Lifecycle Card */}
        <Card className="shadow-xl border-border bg-card/90 backdrop-blur-md rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/8 text-primary shrink-0">
                  <Zap className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base font-bold truncate">Event Lifecycle</CardTitle>
                  <CardDescription className="text-xs mt-0.5 line-clamp-1 sm:line-clamp-none">
                    Control the status and state of your event
                  </CardDescription>
                </div>
              </div>
              <div className="flex justify-start sm:justify-end shrink-0 pl-11 sm:pl-0">
                {getStatusBadge()}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-2.5">
            {event.status === "draft" && (
              <Button
                onClick={() => publishMutation.mutate({ eventId })}
                disabled={publishMutation.isPending}
                className="w-full h-10 rounded-xl font-semibold gap-2 shadow-sm"
              >
                <PlayCircle className="w-4 h-4" />
                {publishMutation.isPending ? "Publishing…" : "Publish Event (Go Live)"}
              </Button>
            )}

            {event.status === "published" && (
              <>
                <Button
                  onClick={() => unpublishMutation.mutate({ eventId })}
                  disabled={unpublishMutation.isPending}
                  variant="outline"
                  className="w-full h-10 rounded-xl font-semibold gap-2 border-border/60"
                >
                  <PauseCircle className="w-4 h-4" />
                  {unpublishMutation.isPending ? "Unpublishing…" : "Pause (Back to Draft)"}
                </Button>
                <Button
                  onClick={() => completeMutation.mutate({ eventId })}
                  disabled={completeMutation.isPending}
                  variant="outline"
                  className="w-full h-10 rounded-xl font-semibold gap-2 border-border/60"
                >
                  <CheckCircle className="w-4 h-4" />
                  {completeMutation.isPending ? "Completing…" : "Mark as Completed"}
                </Button>
              </>
            )}

            <Button
              onClick={() => duplicateMutation.mutate({ eventId })}
              disabled={duplicateMutation.isPending}
              variant="outline"
              className="w-full h-10 rounded-xl font-semibold gap-2 border-border/60"
            >
              <Copy className="w-4 h-4" />
              {duplicateMutation.isPending ? "Duplicating…" : "Duplicate Event"}
            </Button>

            <Button
              onClick={() => {
                if (confirm("Archive this event? It will be hidden from your dashboard.")) {
                  archiveMutation.mutate({ eventId });
                }
              }}
              disabled={archiveMutation.isPending}
              variant="outline"
              className="w-full h-10 rounded-xl font-semibold gap-2 border-border/60 text-muted-foreground hover:text-foreground"
            >
              <Archive className="w-4 h-4" />
              {archiveMutation.isPending ? "Archiving…" : "Archive Event"}
            </Button>

            <Separator className="bg-border/40 my-1" />

            <Button
              onClick={() => {
                if (confirm("Permanently delete this event? This cannot be undone.")) {
                  deleteMutation.mutate({ eventId });
                }
              }}
              disabled={deleteMutation.isPending}
              variant="destructive"
              className="w-full h-10 rounded-xl font-semibold gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleteMutation.isPending ? "Deleting…" : "Delete Event Permanently"}
            </Button>
          </CardContent>
        </Card>

        {/* Settings Form Card */}
        <Card className="shadow-xl border-border bg-card/90 backdrop-blur-md rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-secondary text-muted-foreground">
                <Settings className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Event Configuration</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Edit title, description, visibility, theme, slug, and expiry settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <EventSettingsForm eventId={eventId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
