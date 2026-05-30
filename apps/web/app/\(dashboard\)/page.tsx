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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getTypeBadgeStyles = (type: string) => {
    switch (type) {
      case "form":
        return "bg-blue-500/10 text-blue-600 border-blue-500/25";
      case "poll":
        return "bg-purple-500/10 text-purple-600 border-purple-500/25";
      case "banter":
        return "bg-green-500/10 text-green-600 border-green-500/25";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your forms, polls, and chat rooms.</p>
        </div>
        <Link href="/events/create">
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              My Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{myEvents?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active events you've created</p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-2">
              <Compass className="h-4 w-4 text-blue-600" />
              Public Hub
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{publicEvents?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Public events available</p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">Ready</div>
            <p className="text-xs text-muted-foreground mt-1">Start creating to track engagement</p>
          </CardContent>
        </Card>
      </div>

      {/* My Events Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Your Events</h2>
          <p className="text-sm text-muted-foreground mt-1">Forms, polls, and banter rooms you've created.</p>
        </div>

        {myEvents.length === 0 ? (
          <Card className="border">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No events yet. Create one to get started!</p>
              <Link href="/events/create">
                <Button>Create Your First Event</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {myEvents.map((event: any) => (
              <Card key={event.id} className="border hover:shadow-sm transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground truncate">{event.title}</h3>
                        <Badge variant="outline" className={`shrink-0 ${getTypeBadgeStyles(event.type)}`}>
                          {event.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{event.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span>Created {new Date(event.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/events/${event.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1.5">
                          <Edit3 className="h-4 w-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                      </Link>
                      <Link href={`/e/${event.slug}`} target="_blank">
                        <Button variant="ghost" size="sm" className="gap-1.5">
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Public Events Section */}
      {publicEvents.length > 0 && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Discover Events</h2>
            <p className="text-sm text-muted-foreground mt-1">Popular events from the community.</p>
          </div>

          <div className="grid gap-4">
            {publicEvents.slice(0, 5).map((event: any) => (
              <Card key={event.id} className="border hover:shadow-sm transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground truncate">{event.title}</h3>
                        <Badge variant="outline" className={`shrink-0 ${getTypeBadgeStyles(event.type)}`}>
                          {event.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{event.description}</p>
                    </div>
                    <Link href={`/e/${event.slug}`} target="_blank">
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
