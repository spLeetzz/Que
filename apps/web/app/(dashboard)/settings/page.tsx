"use client";

import { useState } from "react";
import { trpc } from "~/trpc/client";
import { authClient } from "~/lib/auth";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Separator } from "~/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2, Key, Copy, Trash2, Plus, FileCode, ExternalLink,
  Clock, User, Lock, Shield, Code2, AlertTriangle, CheckCircle, Zap,
} from "lucide-react";

type HiddenField = { key: string; required: boolean; type: "string" | "number" | "boolean" };

export default function SettingsPage() {
  // --- Profile state ---
  const { data: session } = authClient.useSession();
  const [displayName, setDisplayName] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // --- Security state ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // --- PAT state ---
  const [patName, setPatName] = useState("");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  // --- Service Form state ---
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showStateGenerator, setShowStateGenerator] = useState(false);
  const [formData, setFormData] = useState<{ title: string; description: string; type: "form" | "poll"; redirectUrl: string; hiddenFields: { key: string; required: boolean; type: "string" | "number" | "boolean" }[] }>({
    title: "", description: "", type: "form",
    redirectUrl: "", hiddenFields: [{ key: "", required: false, type: "string" }],
  });
  const [stateData, setStateData] = useState({ eventId: "", externalUserId: "", metadata: "{}", expiresIn: 900 });
  const [generatedState, setGeneratedState] = useState<{ stateToken: string; formUrl: string; expiresAt: string | Date } | null>(null);

  const { data: patStatus } = trpc.pat.getStatus.useQuery();
  const { data: serviceForms } = trpc.serviceForms.list.useQuery(
    { page: 1, pageSize: 20 },
    { enabled: !!patStatus?.hasActivePAT }
  );
  const utils = trpc.useUtils();

  const generatePATMutation = trpc.pat.generate.useMutation({
    onSuccess: (data) => { setGeneratedToken(data.token); toast.success("Token generated!"); utils.pat.getStatus.invalidate(); setPatName(""); },
    onError: (e) => toast.error(e.message || "Failed to generate PAT"),
  });
  const revokePATMutation = trpc.pat.revoke.useMutation({
    onSuccess: () => { toast.success("Token revoked!"); utils.pat.getStatus.invalidate(); setGeneratedToken(null); },
    onError: (e) => toast.error(e.message || "Failed to revoke token"),
  });
  const createServiceFormMutation = trpc.serviceForms.create.useMutation({
    onSuccess: () => { toast.success("Service form created!"); utils.serviceForms.list.invalidate(); setShowCreateForm(false); },
    onError: (e) => toast.error(e.message || "Failed to create service form"),
  });
  const deleteServiceFormMutation = trpc.serviceForms.delete.useMutation({
    onSuccess: () => { toast.success("Deleted!"); utils.serviceForms.list.invalidate(); },
    onError: (e) => toast.error(e.message || "Failed to delete"),
  });
  const createFormStateMutation = trpc.formStates.create.useMutation({
    onSuccess: (data) => { setGeneratedState(data); toast.success("Token generated!"); },
    onError: (e) => toast.error(e.message || "Failed to generate state"),
  });

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied!"); };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) { toast.error("Name cannot be empty"); return; }
    setIsSavingProfile(true);
    try {
      await authClient.updateUser({ name: displayName.trim() });
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) { toast.error("Please fill all fields"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setIsChangingPassword(true);
    try {
      await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: false });
      toast.success("Password changed successfully!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch {
      toast.error("Failed to change password. Check your current password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCreateServiceForm = () => {
    const validFields = formData.hiddenFields.filter((f) => f.key.trim());
    if (!validFields.length) { toast.error("At least one hidden field required"); return; }
    createServiceFormMutation.mutate({ ...formData, hiddenFields: validFields });
  };

  const handleGenerateFormState = () => {
    let metadata = {};
    try { metadata = JSON.parse(stateData.metadata); } catch { toast.error("Invalid JSON in metadata"); return; }
    createFormStateMutation.mutate({ eventId: stateData.eventId, externalUserId: stateData.externalUserId, metadata, expiresIn: stateData.expiresIn });
  };

  const addHiddenField = () => setFormData({ ...formData, hiddenFields: [...formData.hiddenFields, { key: "", required: false, type: "string" }] });
  const removeHiddenField = (i: number) => setFormData({ ...formData, hiddenFields: formData.hiddenFields.filter((_, idx) => idx !== i) });
  const updateHiddenField = (i: number, f: Partial<HiddenField>) => {
    const u = [...formData.hiddenFields]; u[i] = { ...u[i]!, ...f };
    setFormData({ ...formData, hiddenFields: u });
  };

  const user = session?.user;
  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account, security, and API access</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="gap-1.5"><User className="h-4 w-4" />Profile</TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5"><Lock className="h-4 w-4" />Security</TabsTrigger>
          <TabsTrigger value="developer" className="gap-1.5"><Key className="h-4 w-4" />API Keys</TabsTrigger>
          <TabsTrigger value="service-forms" className="gap-1.5"><Code2 className="h-4 w-4" />Service Forms</TabsTrigger>
        </TabsList>

        {/* ── PROFILE TAB ── */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />My Profile</CardTitle>
              <CardDescription>Update your display name and manage your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar row */}
              <div className="flex items-center gap-5">
                <Avatar className="h-20 w-20 border-2 border-border shadow-sm">
                  <AvatarImage src={user?.image ?? ""} alt={user?.name} />
                  <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{user?.name || "No name set"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {user?.emailVerified
                      ? <Badge variant="outline" className="text-green-600 border-green-500/30 bg-green-500/10"><CheckCircle className="h-3 w-3 mr-1" />Email verified</Badge>
                      : <Badge variant="outline" className="text-yellow-600 border-yellow-500/30 bg-yellow-500/10"><AlertTriangle className="h-3 w-3 mr-1" />Email not verified</Badge>
                    }
                  </div>
                </div>
              </div>

              <Separator />

              {/* Display name */}
              <div className="space-y-2 max-w-sm">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  placeholder={user?.name || "Enter your name"}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">This is how you appear across the platform</p>
              </div>

              <div className="space-y-2 max-w-sm">
                <Label>Email Address</Label>
                <Input value={user?.email || ""} disabled className="bg-muted/40 cursor-not-allowed" />
                <p className="text-xs text-muted-foreground">Email cannot be changed from here</p>
              </div>

              <Button onClick={handleSaveProfile} disabled={isSavingProfile || !displayName.trim()}>
                {isSavingProfile ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Profile"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SECURITY TAB ── */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Password & Security</CardTitle>
              <CardDescription>Change your password and manage account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 max-w-sm">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Passwords do not match</p>
                  )}
                  {confirmPassword && newPassword === confirmPassword && newPassword.length >= 8 && (
                    <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Passwords match</p>
                  )}
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 8}
                >
                  {isChangingPassword ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating...</> : "Change Password"}
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-medium">Active Sessions</h3>
                <p className="text-sm text-muted-foreground">You are currently signed in. To sign out of all devices, use the logout option in the sidebar menu.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── DEVELOPER / PAT TAB ── */}
        <TabsContent value="developer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" />Personal Access Tokens</CardTitle>
              <CardDescription>Generate API tokens for programmatic access. Keep tokens secure — treat them like passwords.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Premium Required Notice */}
              <Alert className="border-primary/30 bg-primary/5">
                <Lock className="h-4 w-4 text-primary" />
                <AlertDescription className="space-y-3">
                  <div>
                    <p className="font-semibold text-foreground">Premium Feature</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Personal Access Tokens are available with the Premium plan. Upgrade to create service forms and integrate Que with your applications.
                    </p>
                  </div>
                  <Button asChild variant="default" size="sm">
                    <a href="/upgrade">
                      <Zap className="h-4 w-4 mr-2" />
                      View Premium Plans
                    </a>
                  </Button>
                </AlertDescription>
              </Alert>

              {/* Locked PAT Section */}
              <div className="opacity-50 pointer-events-none">
                {patStatus && patStatus.hasActivePAT && (
                  <div className="flex justify-between items-center p-4 border rounded-xl bg-muted/30">
                    <div>
                      <p className="font-semibold">{patStatus.name || "Active Token"}</p>
                      <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                        Last used: {patStatus.lastUsedAt ? new Date(patStatus.lastUsedAt).toLocaleString() : "Never"}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge variant="default">
                        Active
                      </Badge>
                      <Button variant="destructive" size="sm" onClick={() => { if (confirm("Revoke this token?")) revokePATMutation.mutate(); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Generated token display */}
                {generatedToken && (
                  <Alert>
                    <AlertDescription className="space-y-2">
                      <p className="font-semibold text-yellow-700 dark:text-yellow-400">⚠️ Save this token now — it won't be shown again!</p>
                      <div className="flex gap-2">
                        <Input value={generatedToken} readOnly className="font-mono text-xs" />
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(generatedToken)}><Copy className="h-4 w-4" /></Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Generate new token */}
                <div className="space-y-3">
                  <Label>Generate New Token</Label>
                  <div className="flex gap-3 max-w-sm">
                    <Input placeholder="Token name (e.g., Production API)" value={patName} onChange={(e) => setPatName(e.target.value)} />
                    <Button onClick={() => generatePATMutation.mutate({ name: patName || "API Token" })} disabled={generatePATMutation.isPending}>
                      {generatePATMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Usage instructions */}
                <div className="p-4 bg-muted/40 rounded-xl space-y-2 border">
                  <p className="text-sm font-semibold">How to use your PAT</p>
                  <code className="block text-xs bg-background p-3 rounded-lg border font-mono">Authorization: Bearer YOUR_TOKEN_HERE</code>
                  <p className="text-xs text-muted-foreground">Include this header in API requests to authenticate with service mode endpoints.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SERVICE FORMS TAB ── */}
        <TabsContent value="service-forms" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2"><FileCode className="h-5 w-5" />Service Forms</CardTitle>
                  <CardDescription>Forms created via API in service mode. Requires Premium plan.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Premium Required Notice */}
              <Alert className="border-primary/30 bg-primary/5">
                <Lock className="h-4 w-4 text-primary" />
                <AlertDescription className="space-y-3">
                  <div>
                    <p className="font-semibold text-foreground">Premium Feature</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Service Forms allow you to integrate Que forms into your applications via API. This feature requires an active Premium plan and Personal Access Token.
                    </p>
                  </div>
                  <Button asChild variant="default" size="sm">
                    <a href="/upgrade">
                      <Zap className="h-4 w-4 mr-2" />
                      View Premium Plans
                    </a>
                  </Button>
                </AlertDescription>
              </Alert>

              {/* Locked Service Forms Section */}
              <div className="opacity-50 pointer-events-none mt-6">
                {!patStatus || !patStatus.hasActivePAT ? (
                  <div className="text-center py-12 space-y-3">
                    <Key className="h-12 w-12 mx-auto text-muted-foreground/40" />
                    <p className="font-medium text-muted-foreground">Active API key required</p>
                    <p className="text-sm text-muted-foreground">Go to the <strong>API Keys</strong> tab to generate a Personal Access Token first.</p>
                  </div>
                ) : serviceForms?.forms?.length ? (
                  <div className="space-y-3">
                    {serviceForms.forms.map((form: any) => (
                      <div key={form.id} className="flex justify-between items-start p-4 border rounded-xl hover:bg-accent/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{form.title}</p>
                            <Badge variant="outline">{form.type}</Badge>
                            <Badge variant="secondary" className="text-xs">service</Badge>
                          </div>
                          {form.description && <p className="text-sm text-muted-foreground mb-2">{form.description}</p>}
                          <div className="flex gap-1 items-center text-xs text-muted-foreground">
                            <ExternalLink className="h-3 w-3" /><span className="truncate max-w-xs">{form.redirectUrl}</span>
                          </div>
                          {form.hiddenFields?.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {form.hiddenFields.map((f: any, i: number) => (
                                <Badge key={i} variant="secondary" className="text-xs">{f.key} ({f.type}){f.required && " *"}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this service form?")) deleteServiceFormMutation.mutate({ id: form.id }); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <FileCode className="h-12 w-12 mx-auto text-muted-foreground/40" />
                    <p className="font-medium text-muted-foreground">No service forms yet</p>
                    <p className="text-sm text-muted-foreground">Create your first service form using the button above</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
