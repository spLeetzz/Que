"use client";

import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Users, MessageSquare, BarChart3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { ExportMenu } from "~/components/analytics/export-menu";
import { AnalyticsOverview } from "~/components/analytics/analytics-overview";
import { QuestionAnalytics } from "~/components/analytics/question-analytics";
import { ResponseTimeline } from "~/components/analytics/response-timeline";

interface ResultsTabProps {
  eventId: string;
  eventTitle: string;
  isConnected?: boolean;
  canManage?: boolean;
}

export function ResultsTab({ eventId, eventTitle, isConnected, canManage = false }: ResultsTabProps) {
  const pollMs = isConnected ? false : 3000;

  const { data: responses } = trpc.responses.listByEvent.useQuery(
    { eventId, page: 1, pageSize: 50 },
    { refetchInterval: pollMs },
  );
  const { data: participants } = trpc.participants.listByEvent.useQuery(
    { eventId },
    { refetchInterval: pollMs },
  );
  const { data: items } = trpc.items.listByEvent.useQuery(
    { eventId },
    { refetchInterval: pollMs },
  );
  const { data: overview, isLoading: overviewLoading } = trpc.analytics.getOverview.useQuery(
    { eventId },
    { refetchInterval: pollMs },
  );
  const { data: questionData, isLoading: questionsLoading } = trpc.analytics.getQuestionAnalytics.useQuery(
    { eventId },
    { refetchInterval: pollMs },
  );
  const { data: timeline, isLoading: timelineLoading } = trpc.analytics.getTimeline.useQuery(
    { eventId },
    { refetchInterval: pollMs },
  );
  const { data: fullAnalytics } = trpc.analytics.getFullAnalytics.useQuery(
    { eventId },
    { refetchInterval: pollMs },
  );

  const utils = trpc.useUtils();

  const deleteResponseMutation = trpc.responses.delete.useMutation({
    onSuccess: () => {
      toast.success("Response deleted");
      utils.responses.listByEvent.invalidate({ eventId });
      utils.analytics.getOverview.invalidate({ eventId });
      utils.analytics.getQuestionAnalytics.invalidate({ eventId });
    },
    onError: (error) => toast.error(error.message || "Failed to delete response"),
  });

  const deleteParticipantMutation = trpc.participants.delete.useMutation({
    onSuccess: () => {
      toast.success("Participant removed");
      utils.participants.listByEvent.invalidate({ eventId });
    },
    onError: (error) => toast.error(error.message || "Failed to remove participant"),
  });

  const questionCount = items?.filter((i) => i.category === "question").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Results & analytics</h2>
          <p className="text-sm text-muted-foreground">Live charts and raw response data</p>
        </div>
        {canManage && <ExportMenu eventTitle={eventTitle} fullAnalytics={fullAnalytics} />}
      </div>

      <AnalyticsOverview data={overview} isLoading={overviewLoading} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ResponseTimeline data={timeline} isLoading={timelineLoading} />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Snapshot</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Responses</span>
              <span className="font-semibold">{responses?.pagination.total ?? responses?.responses.length ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Participants</span>
              <span className="font-semibold">{participants?.length ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Questions</span>
              <span className="font-semibold">{questionCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {questionCount > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Question breakdown</h3>
          <QuestionAnalytics data={questionData} isLoading={questionsLoading} viewMode="summary" />
        </div>
      )}

      <Tabs defaultValue="responses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="responses">Responses</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="answers">Raw answers</TabsTrigger>
        </TabsList>

        <TabsContent value="responses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All responses</CardTitle>
              <CardDescription>Individual submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {responses && responses.responses.length > 0 ? (
                <div className="space-y-3">
                  {responses.responses.map((response) => (
                    <div key={response.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">Response #{response.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                            {new Date(response.submittedAt).toLocaleString()}
                          </p>
                        </div>
                        {response.participantId && (
                          <Badge variant="outline">Participant</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/responses/${response.id}`}>
                          <Button variant="link" size="sm" className="p-0 h-auto">
                            View details
                          </Button>
                        </Link>
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Delete this response?")) {
                                deleteResponseMutation.mutate({ responseId: response.id });
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No responses yet — share your event link to collect data.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              {participants && participants.length > 0 ? (
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{participant.alias}</p>
                        <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                          Joined {new Date(participant.joinedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2 items-center">
                        {participant.submittedAt && <Badge variant="outline">Submitted</Badge>}
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Remove this participant?")) {
                                deleteParticipantMutation.mutate({ participantId: participant.id });
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No participants yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="answers" className="space-y-4">
          {items && items.filter((i) => i.category === "question").length > 0 ? (
            items
              .filter((i) => i.category === "question")
              .map((item) => <QuestionAnswers key={item.id} item={item} />)
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">No questions in this event</CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QuestionAnswers({ item }: { item: { id: string; value: string; category: string; questionType?: string | null; required?: boolean | null } }) {
  const { data: answers } = trpc.answers.listByItem.useQuery({ itemId: item.id });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{item.value}</CardTitle>
        <div className="flex gap-2">
          {item.questionType && <Badge variant="outline">{item.questionType}</Badge>}
          {item.required && <Badge variant="outline">Required</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        {answers && answers.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium mb-3">{answers.length} answers</p>
            {answers.slice(0, 10).map((answer) => (
              <div key={answer.id} className="p-2 bg-muted rounded text-sm">
                {answer.value.join(", ")}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No answers yet</p>
        )}
      </CardContent>
    </Card>
  );
}
