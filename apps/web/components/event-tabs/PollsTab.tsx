"use client";

import React, { useState } from "react";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle, X, BarChart3 } from "lucide-react";
import { cn } from "~/lib/utils";

interface PollsTabProps {
  eventId: string;
  items: any[];
  participantId: string | null;
  isCreator?: boolean;
}

export function PollsTab({ eventId, items, participantId, isCreator = false }: PollsTabProps) {
  const utils = trpc.useUtils();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});

  // Filter to only show question items (polls)
  const polls = items.filter((i) => i.category === "question");

  const createItemMutation = trpc.items.create.useMutation({
    onSuccess: () => {
      toast.success("Poll created!");
      utils.items.listByEvent.invalidate({ eventId });
      setShowCreateDialog(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create poll");
    },
  });

  const deleteItemMutation = trpc.items.delete.useMutation({
    onSuccess: () => {
      toast.success("Poll deleted!");
      utils.items.listByEvent.invalidate({ eventId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete poll");
    },
  });

  const createResponseMutation = trpc.responses.create.useMutation({
    onSuccess: () => {
      toast.success("Vote recorded!");
      utils.items.listByEvent.invalidate({ eventId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to vote");
    },
  });

  const handleCreatePoll = () => {
    if (!pollQuestion.trim()) {
      toast.error("Please enter a poll question");
      return;
    }

    const validOptions = pollOptions.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      toast.error("Please provide at least 2 options");
      return;
    }

    createItemMutation.mutate({
      eventId,
      category: "question",
      value: pollQuestion.trim(),
      questionType: "options",
      required: false,
      participantId: participantId ?? undefined,
      metadata: {
        inputType: "radio",
        choices: validOptions.map((opt) => opt.trim()),
      },
    });
  };

  const handleVote = async (itemId: string, optionText: string) => {
    if (!participantId) {
      toast.error("You must join the banter room to vote");
      return;
    }

    // Optimistic update
    setUserVotes((prev) => ({ ...prev, [itemId]: optionText }));

    try {
      await createResponseMutation.mutateAsync({
        eventId,
        participantId,
        answers: [
          {
            itemId,
            value: [optionText],
          },
        ],
      });
    } catch (err) {
      // Revert on error
      setUserVotes((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    }
  };

  const handleAddOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  return (
    <div className="space-y-6">
      {/* Create poll, creators only (matches backend permission) */}
      {isCreator && (
      <div className="flex justify-between items-center bg-card/45 backdrop-blur-sm border rounded-xl p-4 shadow-sm">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Live Quick Polls
          </h3>
          <p className="text-sm text-muted-foreground">
            Create instant interactive voting for participants inside the banter room
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="shadow-md">
              <Plus className="w-4 h-4 mr-2" />
              Create Poll
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Quick Poll</DialogTitle>
              <DialogDescription>
                Ask a question and add options for participants to vote on
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Poll Question</Label>
                <Input
                  placeholder="e.g. Who's winning the match tonight?"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label>Options</Label>
                <div className="space-y-2">
                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        maxLength={100}
                      />
                      {pollOptions.length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOption(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {pollOptions.length < 6 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                    className="w-full mt-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Option
                  </Button>
                )}
              </div>
              <Button
                onClick={handleCreatePoll}
                disabled={createItemMutation.isPending}
                className="w-full"
              >
                {createItemMutation.isPending ? "Creating..." : "Create Poll"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      )}

      {/* Polls List */}
      {polls.length === 0 ? (
        <Card className="border-dashed border-2 py-12 text-center text-muted-foreground bg-card/20">
          <CardContent className="space-y-2">
            <BarChart3 className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <p className="font-semibold text-sm">No live polls active yet</p>
            <p className="text-xs">
              {isCreator
                ? "Create a quick poll to start collecting votes in real-time!"
                : "The host hasn't started a poll yet, check back soon."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {polls.map((poll, index) => (
            <PollCard
              key={poll.id}
              poll={poll}
              index={index}
              participantId={participantId}
              deleteItemMutation={deleteItemMutation}
              handleVote={handleVote}
              initialUserVote={userVotes[poll.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface PollCardProps {
  poll: any;
  index: number;
  participantId: string | null;
  deleteItemMutation: any;
  handleVote: (itemId: string, option: string) => Promise<void>;
  initialUserVote?: string;
}

function PollCard({
  poll,
  index,
  participantId,
  deleteItemMutation,
  handleVote,
  initialUserVote,
}: PollCardProps) {
  const metadata = poll.metadata as { choices?: string[] } | null;
  const choices = metadata?.choices || [];
  
  const { data: answers } = trpc.answers.listByItem.useQuery(
    { itemId: poll.id },
    { refetchInterval: 2000 } // Poll answers every 2 seconds for live feeling!
  );

  // Determine if this user voted (either stored locally or fetched from answers)
  const myVote = React.useMemo(() => {
    if (initialUserVote) return initialUserVote;
    if (answers && participantId) {
      const myAns = answers.find((ans) => ans.participantId === participantId);
      if (myAns && myAns.value.length > 0) return myAns.value[0];
    }
    return null;
  }, [answers, participantId, initialUserVote]);

  // Aggregate results
  const results = React.useMemo(() => {
    const counts: Record<string, number> = {};
    choices.forEach((c) => {
      counts[c] = 0;
    });

    let total = 0;
    if (answers) {
      answers.forEach((ans) => {
        if (ans.value.length > 0) {
          const val = ans.value[0]!;
          counts[val] = (counts[val] || 0) + 1;
          total++;
        }
      });
    }

    return { counts, total };
  }, [answers, choices]);

  return (
    <Card className="shadow-lg border-border hover:shadow-xl transition-all duration-300 bg-card/65 backdrop-blur-md relative overflow-hidden group">
      {/* Decorative vertical glowing indicator */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40 group-hover:bg-primary transition-colors" />

      <CardHeader className="pb-3 pl-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Poll #{index + 1}
              </Badge>
              {myVote && (
                <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 px-1.5 py-0">
                  Voted
                </Badge>
              )}
            </div>
            <CardTitle className="text-base font-bold text-foreground mt-1">
              {poll.value}
            </CardTitle>
          </div>
          {poll.participantId === participantId && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                if (confirm("Are you sure you want to delete this poll?")) {
                  deleteItemMutation.mutate({ itemId: poll.id });
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 pl-6 pr-6 pb-6">
        <div className="space-y-2">
          {choices.map((choice) => {
            const isSelected = myVote === choice;
            const voteCount = results.counts[choice] || 0;
            const pct = results.total > 0 ? Math.round((voteCount / results.total) * 100) : 0;
            
            return (
              <button
                key={choice}
                type="button"
                onClick={() => handleVote(poll.id, choice)}
                disabled={!!myVote}
                className={cn(
                  "w-full text-left rounded-xl p-3 border-2 transition-all relative overflow-hidden flex items-center justify-between group/btn",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm font-semibold"
                    : "border-muted/60 bg-background/40 hover:border-muted-foreground/30 hover:bg-muted/10",
                  myVote && !isSelected && "opacity-75"
                )}
              >
                {/* Background sliding percentage bar for voted state */}
                {myVote && (
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 -z-10 transition-all duration-700 ease-out",
                      isSelected ? "bg-primary/10" : "bg-muted/40"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                )}

                <div className="flex items-center gap-3 z-10">
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    )}
                  >
                    {isSelected && (
                      <CheckCircle className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm">{choice}</span>
                </div>
                
                {/* Show results percentage if the user has voted */}
                {myVote && (
                  <div className="flex items-center gap-2 z-10 text-xs font-semibold">
                    <span className="text-muted-foreground">({voteCount})</span>
                    <span className="text-foreground">{pct}%</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 pl-1">
          <span>{results.total} {results.total === 1 ? "vote" : "votes"} overall</span>
          {!myVote && <span className="italic">Click an option to cast your vote</span>}
        </div>
      </CardContent>
    </Card>
  );
}
