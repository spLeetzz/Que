"use client";

import { useParams, useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Trash2, User, Calendar, FileText, Hash, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function ResponseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const responseId = params.id as string;

  const { data: response, isLoading } = trpc.responses.getById.useQuery({ responseId });
  const { data: answers } = trpc.answers.listByResponse.useQuery(
    { responseId },
    { enabled: !!response }
  );

  const deleteResponseMutation = trpc.responses.delete.useMutation({
    onSuccess: () => { toast.success("Response deleted."); router.back(); },
    onError: (error) => toast.error(error.message || "Failed to delete response"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!response) {
    return (
      <div className="container mx-auto max-w-2xl py-24 px-4">
        <Card className="border border-dashed border-border/60 rounded-2xl">
          <CardContent className="py-16 text-center space-y-4">
            <div className="size-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <FileText className="size-7" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Response not found</h3>
              <p className="text-muted-foreground text-sm mt-1">This response may have been deleted or the ID is invalid.</p>
            </div>
            <Button onClick={() => router.back()} variant="outline" className="rounded-xl px-6 border-border/60">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4 space-y-6 animate-in fade-in duration-400">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      {/* Header Card */}
      <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/8 text-primary">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Response Details</CardTitle>
                <CardDescription className="text-[11px] font-mono mt-0.5">ID: {response.id}</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("Are you sure you want to delete this response?")) {
                  deleteResponseMutation.mutate({ responseId: response.id });
                }
              }}
              disabled={deleteResponseMutation.isPending}
              className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 gap-1.5 h-8 text-xs font-semibold shrink-0"
            >
              {deleteResponseMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Delete
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/40">
              <div className="size-8 rounded-lg bg-background border border-border/40 flex items-center justify-center shrink-0">
                <Calendar className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Submitted At</p>
                <p className="text-sm font-semibold text-foreground mt-0.5" suppressHydrationWarning>
                  {new Date(response.submittedAt).toLocaleString()}
                </p>
              </div>
            </div>

            {response.participantId && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/40">
                <div className="size-8 rounded-lg bg-background border border-border/40 flex items-center justify-center shrink-0">
                  <User className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Participant ID</p>
                  <p className="text-sm font-semibold font-mono text-foreground mt-0.5 truncate">
                    {response.participantId.slice(0, 16)}…
                  </p>
                </div>
              </div>
            )}

            {response.userId && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/40">
                <div className="size-8 rounded-lg bg-background border border-border/40 flex items-center justify-center shrink-0">
                  <User className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">User ID</p>
                  <p className="text-sm font-semibold font-mono text-foreground mt-0.5 truncate">
                    {response.userId.slice(0, 16)}…
                  </p>
                </div>
              </div>
            )}

            {response.stateId && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/40">
                <div className="size-8 rounded-lg bg-background border border-border/40 flex items-center justify-center shrink-0">
                  <Hash className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">State ID</p>
                  <p className="text-sm font-semibold font-mono text-foreground mt-0.5 truncate">
                    {response.stateId.slice(0, 16)}…
                  </p>
                </div>
              </div>
            )}
          </div>

          {!!response.externalMetadata && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">External Metadata</p>
              <pre className="text-xs bg-secondary/50 border border-border/40 p-4 rounded-xl overflow-x-auto font-mono text-foreground/80 leading-relaxed">
                {JSON.stringify(response.externalMetadata, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Answers Card */}
      <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/8 text-indigo-500">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Submitted Answers</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {answers?.length || 0} {answers?.length === 1 ? "answer" : "answers"} recorded
                </CardDescription>
              </div>
            </div>
            <Badge className="rounded-full px-3 text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              {answers?.length || 0} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {answers && answers.length > 0 ? (
            <div className="divide-y divide-border/40">
              {answers.map((answer, index) => (
                <div key={answer.id} className="px-5 py-4 hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="rounded-lg text-[10px] font-bold px-2 py-0.5 border-border/50">
                      Answer {index + 1}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      item: {answer.itemId.slice(0, 8)}…
                    </span>
                  </div>
                  {answer.value && answer.value.length > 0 ? (
                    <div className="space-y-1.5">
                      {answer.value.map((val, idx) => (
                        <div key={idx} className="px-3 py-2.5 bg-secondary/50 border border-border/40 rounded-xl text-sm text-foreground font-medium">
                          {val}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No answer provided</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12 text-sm">No answers found for this response.</p>
          )}
        </CardContent>
      </Card>

      {/* Event link */}
      <div className="flex justify-center pb-4">
        <Link href={`/events/${response.eventId}/results`}>
          <Button variant="outline" className="rounded-xl border-border/60 font-semibold gap-2 h-10">
            <ExternalLink className="size-4" />
            View All Responses for This Event
          </Button>
        </Link>
      </div>
    </div>
  );
}
