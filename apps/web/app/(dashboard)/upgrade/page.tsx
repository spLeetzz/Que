"use client";

import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { CheckIcon, Zap, Building2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/ month",
    desc: "Perfect for personal use and small gatherings.",
    icon: Sparkles,
    color: "text-muted-foreground",
    iconBg: "bg-secondary",
    accent: "bg-border",
    features: ["Up to 3 active events", "100 responses per event", "Standard analytics", "Public event sharing"],
    cta: "Current Plan",
    ctaVariant: "outline" as const,
    disabled: true,
    recommended: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/ month",
    desc: "For creators, organizers, and educators.",
    icon: Zap,
    color: "text-primary",
    iconBg: "bg-primary/10",
    accent: "bg-primary",
    features: ["Unlimited events", "Unlimited responses", "Real-time WebSocket analytics", "Export CSV & JSON", "Custom slugs & branding", "Priority support"],
    cta: "Upgrade to Pro",
    ctaVariant: "default" as const,
    disabled: false,
    recommended: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "Tailored for large organizations and teams.",
    icon: Building2,
    color: "text-indigo-500",
    iconBg: "bg-indigo-500/10",
    accent: "bg-indigo-500",
    features: ["Dedicated support rep", "Multi-user team sharing", "SAML SSO auth", "99.9% uptime SLA", "Custom integrations", "On-premise options"],
    cta: "Contact Sales",
    ctaVariant: "outline" as const,
    disabled: false,
    recommended: false,
  },
];

export default function UpgradePage() {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-3 py-4">
        <Badge className="rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
          Pricing Plans
        </Badge>
        <h1 className="text-4xl font-extrabold tracking-tight">Choose your plan</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
          Start free. Scale up when you need more power. No hidden fees.
        </p>
      </div>

      {/* Cards */}
      <div className="grid gap-6 md:grid-cols-3 items-start">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          return (
            <Card
              key={plan.name}
              className={`flex flex-col border rounded-2xl overflow-hidden shadow-sm transition-all duration-300 relative ${
                plan.recommended
                  ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]"
                  : "border-border/50 hover:shadow-md"
              }`}
            >
              {/* Accent bar */}
              <div className={`absolute top-0 left-0 w-full h-[3px] ${plan.accent}`} />

              {plan.recommended && (
                <div className="absolute top-4 right-4">
                  <Badge className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-primary text-primary-foreground shadow-sm">
                    Recommended
                  </Badge>
                </div>
              )}

              <CardHeader className="pt-8 px-6 pb-4 space-y-3">
                <div className={`size-10 rounded-xl flex items-center justify-center ${plan.iconBg}`}>
                  <Icon className={`size-5 ${plan.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{plan.desc}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                  {plan.period && <span className="text-sm text-muted-foreground font-medium">{plan.period}</span>}
                </div>
              </CardHeader>

              <CardContent className="flex-1 px-6 pb-6">
                <ul className="space-y-2.5">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm">
                      <div className="size-4 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                        <CheckIcon className="size-2.5 text-emerald-500 stroke-[3]" />
                      </div>
                      <span className="text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="px-6 pb-6">
                <Button
                  variant={plan.ctaVariant}
                  className={`w-full h-11 rounded-xl font-semibold transition-all ${
                    plan.recommended
                      ? "shadow-md hover:shadow-lg shadow-primary/15"
                      : "border-border/60"
                  }`}
                  disabled={plan.disabled}
                  onClick={() => !plan.disabled && toast.success(`Redirecting to ${plan.name} checkout…`)}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Bottom note */}
      <p className="text-center text-xs text-muted-foreground pb-4">
        All plans include SSL security, GDPR compliance, and 24/7 system uptime monitoring.
      </p>
    </div>
  );
}
