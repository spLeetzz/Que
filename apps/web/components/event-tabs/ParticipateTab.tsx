"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { QuestionRenderer } from "~/components/features/question-renderer";
import { CheckCircleIcon, Lock, Clock, LogIn } from "lucide-react";

interface ParticipateTabProps {
  event: {
    title: string;
    status: string;
    authRequired?: boolean;
    redirectUrl?: string | null;
    type?: string;
  };
  items: Array<{
    id: string;
    category: string;
    value: string;
    questionType?: string | null;
    required?: boolean | null;
    metadata?: unknown;
  }>;
  answers: Record<string, string[]>;
  submitted: boolean;
  formErrors: Record<string, string>;
  onFormSubmit: (e: React.FormEvent) => Promise<void>;
  onInputChange: (itemId: string, val: string[]) => void;
  isSubmitting: boolean;
  isCreator?: boolean;
  isAuthenticated?: boolean;
  loginHref?: string;
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
  isCreator = false,
  isAuthenticated = false,
  loginHref = "/login",
}: ParticipateTabProps) {
  const isOpen = event.status === "published";
  const needsAuth = Boolean(event.authRequired) && !isAuthenticated;

  useEffect(() => {
    if (submitted && event.redirectUrl) {
      const timer = setTimeout(() => {
        window.location.href = event.redirectUrl!;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [submitted, event.redirectUrl]);

  if (!isOpen && !isCreator) {
    return (
      <Card className="w-full text-center shadow-xl border-border bg-card/90 backdrop-blur-md">
        <CardContent className="pt-12 pb-12 space-y-4">
          <Clock className="size-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold">Not open yet</h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            {event.status === "draft"
              ? "This event is still a draft and is not accepting responses."
              : event.status === "completed"
                ? "This event has been marked as completed."
                : "This event is not currently accepting responses."}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (needsAuth) {
    return (
      <Card className="w-full text-center shadow-xl border-border bg-card/90 backdrop-blur-md">
        <CardContent className="pt-12 pb-12 space-y-4">
          <Lock className="size-12 text-primary mx-auto" />
          <h2 className="text-xl font-bold">Sign in required</h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            The organizer requires an account before you can submit a response.
          </p>
          <Button asChild className="rounded-xl">
            <Link href={loginHref}>
              <LogIn className="size-4 mr-2" />
              Sign in to continue
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card className="w-full text-center shadow-xl border-border bg-card/90 backdrop-blur-md">
        <CardContent className="pt-12 pb-12 space-y-5">
          <CheckCircleIcon className="size-16 text-emerald-500 mx-auto animate-bounce" />
          <h2 className="text-2xl font-bold">Response recorded</h2>
          <p className="text-muted-foreground text-sm">
            Thank you for participating in {event.title}. Your feedback has been saved.
          </p>
          {event.redirectUrl && (
            <p className="text-xs text-muted-foreground">Redirecting you shortly…</p>
          )}
        </CardContent>
      </Card>
    );
  }

  const questionItems = (items ?? []).filter((i) => i.category === "question");

  if (!isOpen && isCreator) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          Preview mode: publish this event from Settings to start collecting live responses.
        </div>
        {renderForm()}
      </div>
    );
  }

  return renderForm();

  function renderForm() {
    return (
      <form onSubmit={onFormSubmit} className="space-y-6">
        <Card className="shadow-xl border-border bg-card/90 backdrop-blur-md">
          <CardContent className="pt-6 space-y-6">
            {questionItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm italic">
                No questions have been added to this event yet.
              </p>
            ) : (
              questionItems.map((item) => (
                <QuestionRenderer
                  key={item.id}
                  item={{
                    ...item,
                    questionType: (item.questionType ?? null) as
                      | "text"
                      | "slider"
                      | "options"
                      | null,
                    required: item.required ?? false,
                  }}
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
            {isSubmitting ? "Submitting…" : "Submit response"}
          </Button>
        )}
      </form>
    );
  }
}
