"use client";

import { trpc } from "~/trpc/client";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Loader2, Plus, BarChart3, Users, FileText, ArrowRight, Eye, Edit3, Compass } from "lucide-react";

export default function DashboardPage() {
  const { data: myEventsData, isLoading } = trpc.events.listMine.useQuery({ page: 1, pageSize: 20 });
  const { data: publicEventsData } = trpc.events.listPublic.useQuery({ page: 1, pageSize: 20 });

  const myEvents = myEventsData?.events || [];
  const publicEvents = publicEventsData?.events || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" suppressHydrationWarning>
        <Loader2 className="w-8 h-8 animate-spin text-primary" suppressHydrationWarning />
      </div>
    );
  }

  // Type-specific theme colors
  const getTypeBadgeStyles = (type: string) => {
    switch (type) {
      case "form":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/15 border-blue-500/25";
      case "poll":
        return "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/15 border-indigo-500/25";
      case "banter":
        return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/15 border-emerald-500/25";
      default:
        return "bg-muted text-muted-foreground border-border/30";
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Premium Google SaaS Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary/[0.03] to-transparent p-6 rounded-2xl border border-primary/10 shadow-sm shadow-primary/5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage your active forms, quick polls, and banter rooms.</p>
        </div>
        <Link href="/events/create">
          <Button className="rounded-xl shadow-md hover:shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all py-6 px-6 font-semibold">
            <Plus className="w-5 h-5 mr-2 stroke-[2.5]" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-hover border border-border/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-primary" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs uppercase tracking-wider font-bold text-muted-foreground">My Total Events</CardTitle>
            <div className="p-2 rounded-lg bg-primary/5 text-primary">
              <FileText className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-extrabold tracking-tight text-foreground">{myEvents?.length || 0}</div>
            <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
              Active creator dashboard items
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover border border-border/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Global Public Hub</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/5 text-emerald-500">
              <Compass className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-extrabold tracking-tight text-foreground">{publicEvents?.length || 0}</div>
            <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
              Events visible in public gallery
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover border border-border/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-indigo-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Response Analytics</CardTitle>
            <div className="p-2 rounded-lg bg-indigo-500/5 text-indigo-500">
              <BarChart3 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <Link href="/analytics">
              <Button variant="outline" size="sm" className="rounded-lg text-xs font-semibold group h-9 mt-1">
                View Reports
                <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
            <p className="text-[11px] text-muted-foreground mt-2">
              Cross-event engagement analytics
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Middle Column - My Events */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-border/40">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">My Events</h2>
            <Badge variant="secondary" className="rounded-full px-3 py-1 font-semibold text-xs bg-primary/5 text-primary border-primary/10">
              {myEvents.length} total
            </Badge>
          </div>

          {myEvents && myEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {myEvents.map((event) => (
                <Card key={event.id} className="card-hover border border-border/50 shadow-sm flex flex-col justify-between h-[210px]">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg font-bold leading-tight truncate text-foreground pr-2" title={event.title}>
                        {event.title}
                      </CardTitle>
                      <Badge className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        event.status === "published" 
                          ? "bg-green-500/10 text-green-500 border-green-500/25" 
                          : "bg-slate-500/10 text-slate-500 border-slate-500/25"
                      }`}>
                        {event.status}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2 text-sm mt-1">
                      {event.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <div className="flex gap-1.5 flex-wrap">
                      <Badge variant="outline" className={`rounded-lg text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 ${getTypeBadgeStyles(event.type)}`}>
                        {event.type}
                      </Badge>
                      <Badge variant="outline" className="rounded-lg text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 border-border/40 bg-background/50">
                        {event.visibility}
                      </Badge>
                      <Badge variant="outline" className="rounded-lg text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 border-border/40 bg-background/50">
                        {event.mode}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/events/${event.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full rounded-xl text-xs font-semibold hover:bg-secondary">
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/events/${event.id}/edit`} className="flex-1">
                        <Button size="sm" className="w-full rounded-xl text-xs font-semibold shadow-sm">
                          <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border border-dashed border-border/60 bg-secondary/10">
              <CardContent className="flex flex-col items-center justify-center py-14 text-center space-y-4">
                <div className="p-4 rounded-full bg-primary/5 text-primary">
                  <FileText className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">No events created yet</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mt-1">Get started by creating your first interactive form, poll, or chat session.</p>
                </div>
                <Link href="/events/create">
                  <Button className="rounded-xl shadow-md font-semibold">
                    <Plus className="w-4 h-4 mr-1.5" /> Create Your First Event
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Public Showcase */}
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-border/40">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Discover Hub</h2>
          </div>

          {publicEvents && publicEvents.length > 0 ? (
            <div className="space-y-4">
              {publicEvents.slice(0, 5).map((event) => (
                <Card key={event.id} className="card-hover border border-border/45 shadow-sm p-4 relative overflow-hidden">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="font-bold text-sm text-foreground truncate max-w-[170px]" title={event.title}>
                        {event.title}
                      </h4>
                      <Badge variant="outline" className={`rounded-lg text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.25 ${getTypeBadgeStyles(event.type)}`}>
                        {event.type}
                      </Badge>
                    </div>
                    {event.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <Link href={`/events/${event.id}`} className="mt-2">
                      <Button variant="secondary" size="sm" className="w-full rounded-xl text-xs font-semibold text-primary hover:text-primary-foreground hover:bg-primary transition-all">
                        Participate
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border border-dashed border-border/60 bg-secondary/5 py-8 text-center text-muted-foreground text-xs">
              No public events available at the moment.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
