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

interface ResultsTabProps {
  eventId: string;
  eventTitle: string;
  isConnected?: boolean;
}

export function ResultsTab({ eventId, eventTitle, isConnected }: ResultsTabProps) {
  const { data: responses } = trpc.responses.listByEvent.useQuery(
    { eventId, page: 1, pageSize: 50 },
    { refetchInterval: isConnected ? false : 3000 }
  );
  const { data: participants } = trpc.participants.listByEvent.useQuery(
    { eventId },
    { refetchInterval: isConnected ? false : 3000 }
  );
  const { data: items } = trpc.items.listByEvent.useQuery(
    { eventId },
    { refetchInterval: isConnected ? false : 3000 }
  );
  const { data: fullAnalytics } = trpc.analytics.getFullAnalytics.useQuery(
    { eventId },
    { refetchInterval: isConnected ? false : 3000 }
  );
  const utils = trpc.useUtils();

  const deleteResponseMutation = trpc.responses.delete.useMutation({
    onSuccess: () => {
      toast.success("Response deleted!");
      utils.responses.listByEvent.invalidate({ eventId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete response");
    },
  });

  const deleteParticipantMutation = trpc.participants.delete.useMutation({
    onSuccess: () => {
      toast.success("Participant removed!");
      utils.participants.listByEvent.invalidate({ eventId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove participant");
    },
  });

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Results & Responses</h2>
          <p className="text-sm text-muted-foreground">View and export all event data</p>
        </div>
        <ExportMenu eventTitle={eventTitle} fullAnalytics={fullAnalytics} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responses?.responses.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participants?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {items?.filter((i) => i.category === "question").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="responses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="responses">Responses</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="answers">Answers by Question</TabsTrigger>
        </TabsList>

        {/* Responses Tab */}
        <TabsContent value="responses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Responses</CardTitle>
              <CardDescription>Individual responses submitted to this event</CardDescription>
            </CardHeader>
            <CardContent>
              {responses && responses.responses.length > 0 ? (
                <div className="space-y-3">
                  {responses.responses.map((response) => (
                    <div
                      key={response.id}
                      className="p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">Response #{response.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                            {new Date(response.submittedAt).toLocaleString()}
                          </p>
                        </div>
                        {response.participantId && (
                          <Badge variant="outline">
                            Participant: {response.participantId.slice(0, 8)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/responses/${response.id}`}>
                          <Button variant="link" size="sm" className="p-0">
                            View Details
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this response?")) {
                              deleteResponseMutation.mutate({ responseId: response.id });
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No responses yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Participants</CardTitle>
              <CardDescription>People who joined this event</CardDescription>
            </CardHeader>
            <CardContent>
              {participants && participants.length > 0 ? (
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent"
                    >
                      <div>
                        <p className="font-medium">{participant.alias}</p>
                        <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                          Joined: {new Date(participant.joinedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2 items-center">
                        {participant.submittedAt && (
                          <Badge variant="outline">Submitted</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to remove this participant?")) {
                              deleteParticipantMutation.mutate({ participantId: participant.id });
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
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

        {/* Answers by Question Tab */}
        <TabsContent value="answers" className="space-y-4">
          {items && items.filter((i) => i.category === "question").length > 0 ? (
            items
              .filter((i) => i.category === "question")
              .map((item) => <QuestionAnswers key={item.id} item={item} />)
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No questions in this event
              </CardContent>
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
            <p className="text-sm font-medium mb-3">
              {answers.length} {answers.length === 1 ? "answer" : "answers"}
            </p>
            {answers.slice(0, 10).map((answer) => (
              <div key={answer.id} className="p-2 bg-muted rounded text-sm">
                {answer.value.join(", ")}
              </div>
            ))}
            {answers.length > 10 && (
              <p className="text-xs text-muted-foreground">
                ...and {answers.length - 10} more answers
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No answers yet</p>
        )}
      </CardContent>
    </Card>
  );
}
