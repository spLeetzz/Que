"use client";

import { useState, useMemo } from "react";
import { trpc } from "~/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Loader2, TrendingUp, Users, Clock, Target, BarChart3, Download, Activity, CheckCircle2, XCircle, ListChecks, CalendarDays } from "lucide-react";

export default function AnalyticsPage() {
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const { data: myEvents } = trpc.events.listMine.useQuery({ page: 1, pageSize: 100 });
  const { data: analytics, isLoading } = trpc.analytics.getFullAnalytics.useQuery(
    { eventId: selectedEventId },
    { enabled: !!selectedEventId }
  );

  const processedData = useMemo(() => {
    if (!analytics) return null;
    return {
      overview: analytics.overview,
      timeline: analytics.timeline.map(p => ({
        date: new Date(p.date).toLocaleDateString(),
        responses: p.responseCount,
        participants: p.participantCount,
      })),
      funnel: analytics.abandonmentFunnel.map(s => ({
        step: `Q${s.step}`,
        question: s.questionText.slice(0, 40) + (s.questionText.length > 40 ? "…" : ""),
        reached: s.participantsReached,
        abandoned: s.participantsAbandoned,
        completion: Math.round(s.cumulativeCompletion * 100),
      })),
      questions: analytics.questions.map(q => ({
        id: q.itemId, text: q.questionText, type: q.questionType,
        answers: q.totalAnswers, skipRate: Math.round(q.skipRate * 100),
        textSample: q.textAnswers?.slice(0, 5),
        sliderAvg: q.sliderStats?.average,
        sliderRange: q.sliderStats ? `${q.sliderStats.min} – ${q.sliderStats.max}` : null,
        topOptions: q.optionStats?.slice(0, 5).map(o => ({ choice: o.choice, count: o.count, pct: Math.round(o.percentage * 100) })),
      })),
      journeys: {
        completed: analytics.participants.filter(p => p.completed).length,
        abandoned: analytics.participants.filter(p => !p.completed).length,
        avgProgress: Math.round(analytics.participants.reduce((s, p) => s + p.progressPercentage, 0) / (analytics.participants.length || 1) * 100),
        recent: analytics.participants.slice(0, 10).map(p => ({ alias: p.alias, progress: Math.round(p.progressPercentage * 100), completed: p.completed, time: p.timeSpent })),
      },
      responses: analytics.individualResponses,
    };
  }, [analytics]);

  const handleExportCSV = () => {
    if (!processedData?.responses) return;
    const { questions, responses } = processedData.responses;
    const headers = ["Respondent", "Submitted At", ...questions.map(q => q.questionText)];
    const rows = responses.map(r => [r.respondent, new Date(r.submittedAt).toISOString(), ...questions.map(q => r.answers[q.itemId] || "")]);
    const csv = [headers, ...rows].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `analytics-${selectedEventId}-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const selectedEvent = myEvents?.events.find(e => e.id === selectedEventId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-indigo-500/[0.04] to-transparent p-6 rounded-2xl border border-indigo-500/10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm">Deep dive into event engagement and response data.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {processedData?.responses && (
            <Button variant="outline" onClick={handleExportCSV} className="rounded-xl border-border/60 font-semibold gap-2 h-10">
              <Download className="w-4 h-4" suppressHydrationWarning /> Export CSV
            </Button>
          )}
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-[260px] rounded-xl border-border/60 h-10 font-medium">
              <SelectValue placeholder="Select an event…" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/60 shadow-lg">
              {myEvents?.events.map(event => (
                <SelectItem key={event.id} value={event.id} className="rounded-lg cursor-pointer">{event.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedEventId ? (
        <Card className="border border-dashed border-border/60 rounded-2xl">
          <CardContent className="py-20 text-center space-y-4">
            <div className="size-16 rounded-full bg-indigo-500/8 text-indigo-500 flex items-center justify-center mx-auto">
              <BarChart3 className="w-8 h-8" suppressHydrationWarning />
            </div>
            <div>
              <h3 className="font-bold text-lg">Select an event to analyze</h3>
              <p className="text-muted-foreground text-sm mt-1">Choose from your created events above.</p>
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm font-medium">Crunching your analytics…</p>
        </div>
      ) : !processedData ? (
        <Card className="border border-dashed border-border/60 rounded-2xl">
          <CardContent className="py-16 text-center text-muted-foreground text-sm">No analytics data available yet.</CardContent>
        </Card>
      ) : (
        <>
          {selectedEvent && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Viewing:</span>
              <Badge className="rounded-full px-3 py-1 text-xs font-bold bg-primary/10 text-primary border border-primary/20">{selectedEvent.title}</Badge>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: "Total Responses", value: processedData.overview.totalResponses, sub: `${processedData.overview.totalParticipants} participants`, icon: Users, color: "text-primary", bg: "bg-primary/5", bar: "bg-primary" },
              { label: "Completion Rate", value: `${Math.round(processedData.overview.completionRate * 100)}%`, sub: `${Math.round(processedData.overview.abandonmentRate * 100)}% abandoned`, icon: Target, color: "text-emerald-500", bg: "bg-emerald-500/5", bar: "bg-emerald-500" },
              { label: "Avg. Time", value: processedData.overview.averageTimeToComplete ? `${Math.round(processedData.overview.averageTimeToComplete)}s` : "N/A", sub: "to complete", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/5", bar: "bg-amber-500" },
              { label: "Response Rate", value: `${Math.round(processedData.overview.responseRate * 100)}%`, sub: "of participants", icon: TrendingUp, color: "text-indigo-500", bg: "bg-indigo-500/5", bar: "bg-indigo-500" },
            ].map(({ label, value, sub, icon: Icon, color, bg, bar }) => (
              <Card key={label} className="card-hover border border-border/50 shadow-sm relative overflow-hidden rounded-2xl">
                <div className={`absolute top-0 left-0 w-full h-[3px] ${bar}`} />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-5">
                  <CardTitle className="text-xs uppercase tracking-wider font-bold text-muted-foreground">{label}</CardTitle>
                  <div className={`p-2 rounded-lg ${bg} ${color}`}><Icon className="h-4 w-4" suppressHydrationWarning /></div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-extrabold tracking-tight">{value}</div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">{sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="timeline" className="space-y-5">
            <TabsList className="bg-card/65 backdrop-blur-md border border-border/50 p-1.5 rounded-2xl shadow-sm h-auto flex flex-wrap gap-1">
              {["timeline", "funnel", "questions", "journeys", "responses"].map(tab => (
                <TabsTrigger key={tab} value={tab} className="rounded-xl py-2 px-4 font-semibold text-xs tracking-wide cursor-pointer transition-all capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="timeline">
              <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-border/40 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/8 text-primary"><Activity className="h-4 w-4" suppressHydrationWarning /></div>
                    <div><CardTitle className="text-base font-bold">Response Timeline</CardTitle><CardDescription className="text-xs">Responses over time</CardDescription></div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {processedData.timeline.length > 0 ? (
                    <div className="divide-y divide-border/40">
                      {processedData.timeline.map((point, idx) => (
                        <div key={idx} className="flex justify-between items-center px-6 py-3.5 hover:bg-secondary/30 transition-colors">
                          <div className="flex items-center gap-2 text-sm font-medium"><CalendarDays className="size-3.5 text-muted-foreground" suppressHydrationWarning />{point.date}</div>
                          <div className="flex gap-2">
                            <Badge className="rounded-full px-2.5 text-[10px] font-bold bg-primary/10 text-primary border-primary/20">{point.responses} responses</Badge>
                            {point.participants !== point.responses && <Badge variant="outline" className="rounded-full px-2.5 text-[10px] font-bold">{point.participants} participants</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-center text-muted-foreground py-12 text-sm">No timeline data yet.</p>}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="funnel">
              <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-border/40 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/8 text-amber-500"><Target className="h-4 w-4" suppressHydrationWarning /></div>
                    <div><CardTitle className="text-base font-bold">Abandonment Funnel</CardTitle><CardDescription className="text-xs">Where participants drop off</CardDescription></div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {processedData.funnel.length > 0 ? (
                    <div className="space-y-5">
                      {processedData.funnel.map((step, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                              <span className="size-6 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center border border-primary/20">{idx + 1}</span>
                              <span className="text-sm font-semibold">{step.question}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-muted-foreground">{step.reached} reached</span>
                              <Badge className={`rounded-full px-2 text-[10px] font-bold ${step.completion >= 70 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : step.completion >= 40 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>{step.completion}%</Badge>
                            </div>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div className={`h-2 rounded-full transition-all duration-500 ${step.completion >= 70 ? "bg-emerald-500" : step.completion >= 40 ? "bg-amber-500" : "bg-destructive"}`} style={{ width: `${step.completion}%` }} />
                          </div>
                          {step.abandoned > 0 && <p className="text-[11px] text-destructive font-semibold">{step.abandoned} dropped off here</p>}
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-center text-muted-foreground py-8 text-sm">No funnel data available.</p>}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="questions">
              <div className="space-y-4">
                {processedData.questions.length > 0 ? processedData.questions.map(q => (
                  <Card key={q.id} className="border border-border/50 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-border/40 pb-4">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <Badge variant="outline" className="rounded-lg text-[10px] font-bold uppercase px-2">{q.type}</Badge>
                        <Badge className="rounded-lg text-[10px] font-bold px-2 bg-primary/10 text-primary border-primary/20">{q.answers} answers</Badge>
                        {q.skipRate > 0 && <Badge className="rounded-lg text-[10px] font-bold px-2 bg-amber-500/10 text-amber-500 border-amber-500/20">{q.skipRate}% skipped</Badge>}
                      </div>
                      <CardTitle className="text-base font-bold leading-snug">{q.text}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-3">
                      {q.type === "text" && q.textSample && q.textSample.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sample Responses</p>
                          {q.textSample.map((t, i) => <div key={i} className="px-3 py-2 bg-secondary/50 border border-border/40 rounded-xl text-sm">{t}</div>)}
                        </div>
                      )}
                      {q.type === "slider" && q.sliderAvg && (
                        <div className="flex items-center gap-6">
                          <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Average</p><p className="text-2xl font-extrabold">{q.sliderAvg}</p></div>
                          {q.sliderRange && <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Range</p><p className="text-lg font-bold">{q.sliderRange}</p></div>}
                        </div>
                      )}
                      {q.type === "options" && q.topOptions && (
                        <div className="space-y-2.5">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Top Choices</p>
                          {q.topOptions.map((opt, i) => (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{opt.choice}</span>
                                <span className="text-xs font-bold text-muted-foreground">{opt.count} ({opt.pct}%)</span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-1.5">
                                <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${opt.pct}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )) : (
                  <Card className="border border-dashed border-border/60 rounded-2xl">
                    <CardContent className="py-10 text-center text-muted-foreground text-sm">No questions in this event.</CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="journeys">
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {[
                    { label: "Completed", value: processedData.journeys.completed, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/5", bar: "bg-emerald-500" },
                    { label: "Abandoned", value: processedData.journeys.abandoned, icon: XCircle, color: "text-destructive", bg: "bg-destructive/5", bar: "bg-destructive" },
                    { label: "Avg. Progress", value: `${processedData.journeys.avgProgress}%`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/5", bar: "bg-primary" },
                  ].map(({ label, value, icon: Icon, color, bg, bar }) => (
                    <Card key={label} className="border border-border/50 shadow-sm rounded-2xl relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-full h-[3px] ${bar}`} />
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5">
                        <CardTitle className="text-xs uppercase tracking-wider font-bold text-muted-foreground">{label}</CardTitle>
                        <div className={`p-2 rounded-lg ${bg} ${color}`}><Icon className="h-4 w-4" suppressHydrationWarning /></div>
                      </CardHeader>
                      <CardContent><div className="text-3xl font-extrabold tracking-tight">{value}</div></CardContent>
                    </Card>
                  ))}
                </div>
                <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="border-b border-border/40 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary/8 text-primary"><ListChecks className="h-4 w-4" suppressHydrationWarning /></div>
                      <div><CardTitle className="text-base font-bold">Recent Participant Journeys</CardTitle><CardDescription className="text-xs">Latest 10 participant records</CardDescription></div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/40">
                      {processedData.journeys.recent.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center px-6 py-3.5 hover:bg-secondary/30 transition-colors">
                          <div>
                            <p className="font-semibold text-sm">{p.alias}</p>
                            {p.time && <p className="text-[11px] text-muted-foreground">{p.time}s spent</p>}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-28 bg-secondary rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full transition-all ${p.completed ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${p.progress}%` }} />
                            </div>
                            <span className="text-xs font-bold w-10 text-right">{p.progress}%</span>
                            {p.completed && <Badge className="rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2">Done</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="responses">
              <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-border/40 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-500/8 text-indigo-500"><Users className="h-4 w-4" suppressHydrationWarning /></div>
                    <div><CardTitle className="text-base font-bold">Individual Responses</CardTitle><CardDescription className="text-xs">{processedData.responses?.pagination.totalResponses || 0} total recorded</CardDescription></div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {processedData.responses && processedData.responses.responses.length > 0 ? (
                    <>
                      <div className="divide-y divide-border/40">
                        {processedData.responses.responses.slice(0, 20).map(response => (
                          <div key={response.responseId} className="flex justify-between items-center px-6 py-4 hover:bg-secondary/30 transition-colors">
                            <div>
                              <p className="font-semibold text-sm">{response.respondent}</p>
                              <p className="text-[11px] text-muted-foreground font-mono" suppressHydrationWarning>{new Date(response.submittedAt).toLocaleString()}</p>
                            </div>
                            <Badge variant="outline" className="rounded-full px-2.5 text-[10px] font-bold">{Object.values(response.answers).filter(a => a).length} answers</Badge>
                          </div>
                        ))}
                      </div>
                      {processedData.responses.responses.length > 20 && (
                        <p className="text-xs text-muted-foreground text-center py-4 border-t border-border/40">Showing 20 of {processedData.responses.responses.length}, export CSV for full data</p>
                      )}
                    </>
                  ) : <p className="text-center text-muted-foreground py-12 text-sm">No responses yet.</p>}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
