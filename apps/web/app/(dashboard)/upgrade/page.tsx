"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { CheckIcon, Zap, Building2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Create unlimited polls, forms, and banters for as long as the app is alive.",
    icon: Sparkles,
    color: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    accent: "bg-emerald-500",
    features: [
      "Unlimited events (polls, forms, banters)",
      "Unlimited responses",
      "Real-time WebSocket support",
      "Public event sharing",
      "Standard analytics",
      "Available forever while app is live",
    ],
    cta: "Current Plan",
    ctaVariant: "outline" as const,
    disabled: true,
    recommended: false,
  },
  {
    name: "Premium",
    price: "Contact",
    period: "",
    desc: "Create service forms for your app with API integration and advanced features.",
    icon: Zap,
    color: "text-primary",
    iconBg: "bg-primary/10",
    accent: "bg-primary",
    features: [
      "Everything in Free",
      "Service Forms API access",
      "Personal Access Tokens (PAT)",
      "Hidden fields & metadata",
      "State token generation",
      "Custom redirect URLs",
      "Priority support",
    ],
    cta: "Contact for Premium",
    ctaVariant: "default" as const,
    disabled: false,
    recommended: true,
    contactEmail: "adityapratap2404@gmail.com",
  },
];

export default function UpgradePage() {
  const handleContactPremium = () => {
    window.location.href =
      "mailto:adityapratap2404@gmail.com?subject=Premium Plan Inquiry - Service Forms";
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-3 py-4">
        <Badge className="rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
          Pricing Plans
        </Badge>
        <h1 className="text-4xl font-extrabold tracking-tight">Choose your plan</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
          Start free forever. Upgrade to Premium for service forms and API access.
        </p>
      </div>

      {/* Cards */}
      <div className="grid gap-6 md:grid-cols-2 items-stretch max-w-4xl mx-auto">
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
                  <Badge className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-primary text-primary-foreground/90 shadow-sm">
                    DEAL
                  </Badge>
                </div>
              )}

              <CardHeader className="pt-8 px-6 pb-4 space-y-3">
                <div
                  className={`size-10 rounded-xl flex items-center justify-center ${plan.iconBg}`}
                >
                  <Icon className={`size-5 ${plan.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {plan.desc}
                  </p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-muted-foreground font-medium">
                      {" "}
                      {plan.period}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 px-6 pb-6">
                <ul className="space-y-2.5">
                  {plan.features.map((feature) => (
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
                  onClick={() => {
                    if (!plan.disabled) {
                      if (plan.contactEmail) {
                        handleContactPremium();
                      } else {
                        toast.success(`Redirecting to ${plan.name} checkout…`);
                      }
                    }
                  }}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Premium Info Section */}
      <Card className="max-w-4xl mx-auto border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            How Premium Service Forms Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Service Forms</strong> allow you to integrate Que
            forms directly into your application via API. Perfect for collecting user feedback,
            surveys, or any data collection needs within your own app.
          </p>
          <div className="space-y-2">
            <p className="font-semibold text-foreground">Key Features:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Generate Personal Access Tokens (PAT) for API authentication</li>
              <li>Create forms programmatically with hidden fields and metadata</li>
              <li>Generate one-time state tokens for secure user access</li>
              <li>Redirect users back to your app after form submission</li>
              <li>Track responses and analytics through the API</li>
            </ul>
          </div>
          <p>
            <strong className="text-foreground">Use Case Example:</strong> Your SaaS app needs to
            collect customer feedback. Create a service form via API, generate a state token for
            each user, and embed the form link in your app. After submission, users are redirected
            back to your app with the response data.
          </p>
          <p className="text-xs">
            Contact{" "}
            <a
              href="mailto:adityapratap2404@gmail.com"
              className="text-primary hover:underline font-medium"
            >
              adityapratap2404@gmail.com
            </a>{" "}
            to discuss your requirements and get started with Premium.
          </p>
        </CardContent>
      </Card>

      {/* Bottom note */}
      <p className="text-center text-xs text-muted-foreground pb-4">
        All plans include SSL security, GDPR compliance, and 24/7 system uptime monitoring.
      </p>
    </div>
  );
}
