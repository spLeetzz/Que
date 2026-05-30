"use client";

import React from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { QuestionRenderer } from "~/components/features/question-renderer";
import { CheckCircleIcon } from "lucide-react";

interface ParticipateTabProps {
  event: any;
  items: any[];
  answers: Record<string, string[]>;
  submitted: boolean;
  formErrors: Record<string, string>;
  onFormSubmit: (e: React.FormEvent) => Promise<void>;
  onInputChange: (itemId: string, val: string[]) => void;
  isSubmitting: boolean;
}

export function ParticipateTab({
  event,
  items,
  answers,
  submitted,
  formErrors,
  onFormSubmit,
  onInputChange,
  isSubmitting,
}: ParticipateTabProps) {
  // Show success message after submission
  if (submitted) {
    return (
      <Card className="w-full text-center shadow-xl border-border bg-card/90 backdrop-blur-md">
        <CardContent className="pt-12 pb-12 space-y-5">
          <CheckCircleIcon className="size-16 text-emerald-500 mx-auto animate-bounce" />
          <h2 className="text-2xl font-bold">Response Recorded!</h2>
          <p className="text-muted-foreground text-sm">
            Thank you for participating in {event.title}. Your feedback has been safely logged.
          </p>
        </CardContent>
      </Card>
    );
  }

  const questionItems = (items ?? []).filter((i) => i.category === "question");

  // Form/Poll interface - NO CHAT
  return (
    <form onSubmit={onFormSubmit} className="space-y-6">
      <Card className="shadow-xl border-border bg-card/90 backdrop-blur-md">
        <CardContent className="pt-6 space-y-6">
          {questionItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm italic">
              No questions added yet to this event.
            </p>
          ) : (
            questionItems.map((item) => (
              <QuestionRenderer
                key={item.id}
                item={item}
                answer={answers[item.id] ?? []}
                onChange={(val) => onInputChange(item.id, val)}
                error={formErrors[item.id]}
              />
            ))
          )}
        </CardContent>
      </Card>
      {questionItems.length > 0 && (
        <Button
          type="submit"
          className="w-full h-11 text-sm font-semibold tracking-wide shadow-lg hover:shadow-xl transition-all"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting Answers..." : "Submit Response"}
        </Button>
      )}
    </form>
  );
}
