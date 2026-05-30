"use client";

import React, { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { SendIcon, Users2 } from "lucide-react";
import { cn } from "~/lib/utils";

interface ChatTabProps {
  items: any[];
  participants: any[];
  participantId: string | null;
  chatMessage: string;
  setChatMessage: (msg: string) => void;
  participantStatuses: Record<string, string>;
  onSendChatMessage: (e: React.FormEvent) => Promise<void>;
  onChatTyping: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AVATAR_COLORS = [
  "bg-blue-500/15 text-blue-500",
  "bg-emerald-500/15 text-emerald-500",
  "bg-violet-500/15 text-violet-500",
  "bg-amber-500/15 text-amber-500",
  "bg-rose-500/15 text-rose-500",
  "bg-indigo-500/15 text-indigo-500",
];

export function ChatTab({
  items, participants, participantId, chatMessage, setChatMessage,
  participantStatuses, onSendChatMessage, onChatTyping,
}: ChatTabProps) {
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const participantMap = React.useMemo(() => {
    const map: Record<string, { alias: string; colorClass: string }> = {};
    if (participants) {
      participants.forEach((p, i) => {
        map[p.id] = { alias: p.alias, colorClass: AVATAR_COLORS[i % AVATAR_COLORS.length] };
      });
    }
    return map;
  }, [participants]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items]);

  const chatItems = (items ?? []).filter(i => i.category === "chat");
  const isTyping = Object.entries(participantStatuses).some(([pid, status]) => pid !== participantId && status === "typing");

  return (
    <Card className="flex flex-col border border-border/50 shadow-sm rounded-2xl overflow-hidden bg-card/70 backdrop-blur-md" style={{ height: "580px" }}>
      {/* Header */}
      <CardHeader className="border-b border-border/40 px-5 py-3.5 bg-secondary/30 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Users2 className="size-4" />
            </div>
            <span className="text-sm font-bold tracking-tight">Banter Chat Room</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-bold text-emerald-500 tracking-wide uppercase">{participants.length} in room</span>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 scroll-smooth">
        {chatItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="size-12 rounded-full bg-secondary flex items-center justify-center text-2xl">💬</div>
            <div>
              <p className="font-semibold text-sm text-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">Send a message to spark the banter!</p>
            </div>
          </div>
        ) : (
          chatItems.map(msg => {
            const sender = msg.participantId ? participantMap[msg.participantId] : undefined;
            const isSelf = msg.participantId === participantId;
            return (
              <div key={msg.id} className={cn("flex items-end gap-2.5", isSelf && "flex-row-reverse")}>
                {!isSelf && (
                  <Avatar className={cn("size-7 border border-border/30 shrink-0 text-[10px] font-black bg-muted text-muted-foreground", sender?.colorClass ?? "")}>
                    <AvatarFallback className={cn("text-[10px] font-black", sender?.colorClass ?? "")}>
                      {sender?.alias?.substring(0, 2).toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("flex flex-col max-w-[72%] gap-0.5", isSelf && "items-end")}>
                  {!isSelf && (
                    <span className="text-[10px] font-bold text-muted-foreground tracking-wide px-1">
                      {sender?.alias || "Anonymous"}
                    </span>
                  )}
                  <div className={cn(
                    "px-3.5 py-2.5 rounded-2xl text-sm font-medium shadow-sm leading-relaxed",
                    isSelf
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border/50 text-foreground rounded-bl-sm"
                  )}>
                    {msg.value}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </CardContent>

      {/* Input */}
      <div className="shrink-0 border-t border-border/40 bg-secondary/20 px-4 py-3 space-y-2">
        {isTyping && (
          <p className="text-[11px] text-muted-foreground italic animate-pulse pl-1">
            Someone is typing…
          </p>
        )}
        <form onSubmit={onSendChatMessage} className="flex gap-2">
          <Input
            placeholder={participantId ? "Say something…" : "Join the room to chat"}
            value={chatMessage}
            onChange={onChatTyping}
            disabled={!participantId}
            className="flex-1 rounded-xl h-10 border-border/60 bg-background/80 focus-visible:ring-primary text-sm font-medium"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!chatMessage.trim() || !participantId}
            className="rounded-xl size-10 shadow-sm"
          >
            <SendIcon className="size-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
