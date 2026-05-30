"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Clock, User, FileText } from "lucide-react";

function ValidateStateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [eventId, setEventId] = useState(searchParams.get("eventId") || "");
  const [stateToken, setStateToken] = useState(searchParams.get("token") || "");
  const [validationResult, setValidationResult] = useState<any>(null);

  const validateMutation = trpc.formStates.validate.useMutation({
    onSuccess: (data) => {
      setValidationResult(data);
    },
    onError: (error) => {
      setValidationResult({ valid: false, error: error.message });
    },
  });

  const handleValidate = () => {
    if (!eventId || !stateToken) return;
    validateMutation.mutate({ eventId, stateToken });
  };

  const handleProceed = () => {
    if (validationResult?.valid) {
      router.push(`/events/${eventId}?token=${stateToken}`);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl min-h-screen flex items-center justify-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Validate Form State Token
          </CardTitle>
          <CardDescription>
            Verify your access token to participate in a service form
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eventId">Event/Form ID</Label>
              <Input
                id="eventId"
                placeholder="Enter event ID"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stateToken">State Token</Label>
              <Input
                id="stateToken"
                placeholder="Enter your state token"
                value={stateToken}
                onChange={(e) => setStateToken(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <Button
              onClick={handleValidate}
              disabled={!eventId || !stateToken || validateMutation.isPending}
              className="w-full"
            >
              {validateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Validate Token
            </Button>
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div className="space-y-4">
              {validationResult.valid ? (
                <>
                  <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      <p className="font-semibold mb-2">Token is valid!</p>
                      <p className="text-sm">You can proceed to access the form.</p>
                    </AlertDescription>
                  </Alert>

                  {/* Token Details */}
                  <div className="space-y-3 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold text-sm">Token Details:</h3>
                    
                    {validationResult.externalUserId && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">User ID:</span>
                        <span className="font-mono">{validationResult.externalUserId}</span>
                      </div>
                    )}

                    {validationResult.expiresAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Expires:</span>
                        <span suppressHydrationWarning>{new Date(validationResult.expiresAt).toLocaleString()}</span>
                      </div>
                    )}

                    {validationResult.used !== undefined && (
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant={validationResult.used ? "secondary" : "default"}>
                          {validationResult.used ? "Already Used" : "Not Used Yet"}
                        </Badge>
                      </div>
                    )}

                    {validationResult.metadata && Object.keys(validationResult.metadata).length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Metadata:</p>
                        <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                          {JSON.stringify(validationResult.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  <Button onClick={handleProceed} className="w-full" size="lg">
                    Proceed to Form
                  </Button>
                </>
              ) : (
                <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    <p className="font-semibold mb-2">Token is invalid</p>
                    <p className="text-sm">
                      {validationResult.error || "The token may be expired, already used, or incorrect."}
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Help Text */}
          <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
            <p className="font-medium">What is a state token?</p>
            <p>
              State tokens are one-time access codes generated for external users to access
              service forms. They expire after a set time and can only be used once.
            </p>
            <p className="text-xs">
              If you don&apos;t have a token, contact the form administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ValidateStatePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ValidateStateContent />
    </Suspense>
  );
}
