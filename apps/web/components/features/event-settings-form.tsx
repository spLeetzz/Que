"use client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useRef, useCallback, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useEvent } from "~/hooks/use-event";
import { useUpdateEvent } from "~/hooks/use-update-event";
import { Skeleton } from "~/components/ui/skeleton";
import { ThemeSelector } from "~/components/features/theme-selector";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import { CalendarIcon, Check, RotateCcw, Save } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";

const formatDateTimeLocal = (date: Date | null | undefined | string): string => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const eventSettingsSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Max 200 characters"),
  description: z.string().optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, "Only lowercase letters, numbers, and hyphens")
    .nullable()
    .optional(),
  visibility: z.enum(["public", "private"]),
  resultVisibility: z.enum(["all", "creator_only"]),
  authRequired: z.boolean(),
  multipleResponses: z.boolean(),
  receiveEmails: z.boolean(),
  theme: z.string().nullable().optional(),
  expiresAt: z.union([z.string(), z.date()]).nullable().optional(),
});

type EventSettingsData = z.infer<typeof eventSettingsSchema>;

interface EventSettingsFormProps {
  eventId: string;
}

// Toggle component replacing raw checkbox
function Toggle({
  checked,
  onChange,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out",
          checked ? "translate-x-4" : "translate-x-0",
        )}
      />
    </button>
  );
}

// Radio option pill
function RadioPill({
  value,
  current,
  onChange,
  disabled,
  label,
}: {
  value: string;
  current: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  label: string;
}) {
  const selected = value === current;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(value)}
      className={cn(
        "relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
        selected
          ? "bg-primary/10 border-primary/40 text-foreground"
          : "bg-transparent border-border/50 text-muted-foreground hover:border-border hover:text-foreground",
      )}
    >
      {selected && <Check className="h-3 w-3 shrink-0" />}
      {label}
    </button>
  );
}

// Section wrapper
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-0.5">
        <h4 className="text-sm font-semibold text-foreground tracking-wide uppercase opacity-60">
          {title}
        </h4>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// Field wrapper
function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

// Toggle row
function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border/30 last:border-0">
      <div className="flex-1 min-w-0">
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Toggle id={id} checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

export function EventSettingsForm({ eventId }: EventSettingsFormProps) {
  const { data: event, isLoading } = useEvent(eventId);
  const updateEvent = useUpdateEvent(eventId);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  const form = useForm<EventSettingsData>({
    resolver: zodResolver(eventSettingsSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      slug: null,
      visibility: "public",
      resultVisibility: "all",
      authRequired: false,
      multipleResponses: false,
      receiveEmails: false,
      theme: null,
      expiresAt: "",
    },
  });

  const [open, setOpen] = useState(false);
  const expiresAt = form.watch("expiresAt");

  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        description: event.description ?? "",
        slug: event.slug,
        visibility: event.visibility,
        resultVisibility: event.resultVisibility,
        authRequired: event.authRequired,
        multipleResponses: event.multipleResponses,
        receiveEmails: event.receiveEmails,
        theme: event.theme ?? null,
        expiresAt: formatDateTimeLocal(event.expiresAt),
      });
    }
  }, [event, form]);

  const doSaveRef = useRef<((data: EventSettingsData) => Promise<void>) | null>(null);

  const doSave = useCallback(
    async (data: EventSettingsData) => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      try {
        await updateEvent.mutateAsync({
          ...data,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        } as any);
        toast.success("Saved");
        form.reset(data, { keepDefaultValues: false });
      } catch {
        toast.error("Failed to save");
      } finally {
        isSavingRef.current = false;
      }
    },
    [updateEvent, form],
  );

  doSaveRef.current = doSave;

  useEffect(() => {
    const sub = form.watch(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (!form.formState.isDirty) return;
        form.handleSubmit((data) => doSaveRef.current?.(data))();
      }, 1200);
    });
    return () => {
      sub.unsubscribe();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form]);

  const { errors } = form.formState;
  const isSubmitting = updateEvent.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(doSave)} className="space-y-8">
      {/* Auto-save indicator */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {isSubmitting
            ? "Saving…"
            : form.formState.isDirty
              ? "Unsaved changes"
              : "All changes saved"}
        </p>
      </div>

      {/* Basic */}
      <Section title="Basic" description="Core event information">
        <Field label="Title" htmlFor="title" error={errors.title?.message}>
          <Input
            id="title"
            placeholder="Event title"
            {...form.register("title")}
            disabled={isSubmitting}
          />
        </Field>

        <Field
          label="Description"
          htmlFor="description"
          hint="Optional context or instructions for respondents"
        >
          <Textarea
            id="description"
            placeholder="Add a description…"
            rows={3}
            {...form.register("description")}
            disabled={isSubmitting}
            className="resize-none"
          />
        </Field>

        <Field
          label="URL Slug"
          htmlFor="slug"
          error={errors.slug?.message}
          hint="Lowercase letters, numbers, and hyphens only. Leave empty for auto-generated."
        >
          <Input
            id="slug"
            placeholder="my-event-slug"
            {...form.register("slug")}
            disabled={isSubmitting}
          />
        </Field>
      </Section>

      {/* Visibility */}
      <Section title="Visibility" description="Who can access and see results">
        <Field label="Event access">
          <Controller
            control={form.control}
            name="visibility"
            render={({ field }) => (
              <div className="flex gap-2">
                <RadioPill
                  value="public"
                  current={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  label="Public"
                />
                <RadioPill
                  value="private"
                  current={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  label="Private"
                />
              </div>
            )}
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Public events are accessible to anyone with the link
          </p>
        </Field>

        <Field label="Results visibility">
          <Controller
            control={form.control}
            name="resultVisibility"
            render={({ field }) => (
              <div className="flex gap-2">
                <RadioPill
                  value="all"
                  current={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  label="Everyone"
                />
                <RadioPill
                  value="creator_only"
                  current={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  label="Creator only"
                />
              </div>
            )}
          />
        </Field>
      </Section>

      {/* Behavior */}
      <Section title="Behavior" description="How participants interact with your event">
        <div className="rounded-xl border border-border/40 bg-muted/20 px-4 divide-y divide-border/30">
          <Controller
            control={form.control}
            name="authRequired"
            render={({ field }) => (
              <ToggleRow
                id="authRequired"
                label="Require authentication"
                description="Participants must be logged in to respond"
                checked={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
          <Controller
            control={form.control}
            name="multipleResponses"
            render={({ field }) => (
              <ToggleRow
                id="multipleResponses"
                label="Allow multiple responses"
                description="Same user can submit more than once"
                checked={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
          <Controller
            control={form.control}
            name="receiveEmails"
            render={({ field }) => (
              <ToggleRow
                id="receiveEmails"
                label="Email notifications"
                description="Get notified by email for each new response"
                checked={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
        </div>
      </Section>

      {/* Advanced */}
      <Section title="Advanced" description="Theme and scheduling">
        <Field label="Background theme">
          <Controller
            control={form.control}
            name="theme"
            render={({ field }) => (
              <ThemeSelector
                value={field.value ?? null}
                onChange={(theme) => form.setValue("theme", theme, { shouldDirty: true })}
                disabled={isSubmitting}
              />
            )}
          />
        </Field>
        <Field
          label="Expiration date"
          hint="Leave empty for no expiration. Event closes automatically after this date."
          error={errors.expiresAt?.message}
        >
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={isSubmitting}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !expiresAt && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {expiresAt ? format(new Date(expiresAt), "PPP p") : "Pick a date & time"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={expiresAt ? new Date(expiresAt) : undefined}
                onSelect={(date) => {
                  if (!date) {
                    form.setValue("expiresAt", "", { shouldDirty: true });
                    return;
                  }
                  // preserve existing time if already set
                  const existing = expiresAt ? new Date(expiresAt) : new Date();
                  date.setHours(existing.getHours(), existing.getMinutes());

                  form.setValue("expiresAt", date.toISOString(), {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                disabled={(date) => date < new Date()}
                initialFocus
              />
              <div className="border-t p-3 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Time</span>
                <Input
                  type="time"
                  className="w-fit [color-scheme:dark]"
                  value={expiresAt ? format(new Date(expiresAt), "HH:mm") : ""}
                  onChange={(e) => {
                    const [h = 0, m = 0] = e.target.value.split(":").map(Number);
                    const base = expiresAt ? new Date(expiresAt) : new Date();
                    base.setHours(h, m);
                    form.setValue("expiresAt", base.toISOString(), {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
                {expiresAt && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-muted-foreground"
                    onClick={() => {
                      form.setValue("expiresAt", "", { shouldDirty: true });
                      setOpen(false);
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </Field>
      </Section>
    </form>
  );
}
