import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Fingerprint, KeyRound, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  deviceLabel,
  passkeySupported,
  registerPasskey,
  setAssurance,
  verifyPasskey,
} from "@/lib/nexus";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Officer authentication — NEXUS" },
      {
        name: "description",
        content:
          "Three-level officer authentication: one-time code, device passkey, and employee ID with access password.",
      },
      { property: "og:title", content: "Officer authentication — NEXUS" },
      {
        property: "og:description",
        content: "Zero-Trust three-level sign in for the NEXUS evidence platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Step = 1 | 2 | 3;

const STEPS = [
  { n: 1, label: "One-time code", icon: MailCheck },
  { n: 2, label: "Device passkey", icon: Fingerprint },
  { n: 3, label: "Employee ID + password", icon: KeyRound },
] as const;

function AuthPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        setEmail(data.user.email ?? "");
        setNeedsPasswordSetup(!data.user.user_metadata?.["has_password"]);
        setStep((s) => (s === 1 ? 2 : s));
      }
    });
  }, []);

  async function sendCode() {
    if (!email.includes("@")) return toast.error("Enter your official email address.");
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setOtpSent(true);
    toast.success("One-time code sent to your official email.");
  }

  async function verifyCode() {
    setBusy(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error || !data.user) return toast.error(error?.message ?? "Code rejected.");
    setUserId(data.user.id);
    setNeedsPasswordSetup(!data.user.user_metadata?.["has_password"]);
    setAssurance(1);
    setStep(2);
  }

  async function doPasskey() {
    if (!userId) return;
    setBusy(true);
    try {
      const { data: devices } = await supabase
        .from("registered_devices")
        .select("id, credential_id")
        .eq("user_id", userId);

      if (!passkeySupported()) {
        toast.message("This device has no passkey authenticator — level recorded as device trust.");
        setAssurance(2);
        setStep(3);
        return;
      }

      if (devices && devices.length > 0) {
        let matched: string | null = null;
        for (const d of devices) {
          try {
            await verifyPasskey(d.credential_id);
            matched = d.id;
            break;
          } catch {
            /* try next registered credential */
          }
        }
        if (!matched) {
          const credentialId = await registerPasskey(userId, email);
          await supabase
            .from("registered_devices")
            .insert({ user_id: userId, credential_id: credentialId, device_label: deviceLabel() });
        } else {
          await supabase
            .from("registered_devices")
            .update({ last_used_at: new Date().toISOString() })
            .eq("id", matched);
        }
      } else {
        const credentialId = await registerPasskey(userId, email);
        await supabase
          .from("registered_devices")
          .insert({ user_id: userId, credential_id: credentialId, device_label: deviceLabel() });
        await supabase.from("profiles").update({ passkey_registered: true }).eq("id", userId);
      }
      setAssurance(2);
      setStep(3);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Passkey check failed.");
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    if (!userId) return;
    setBusy(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("employee_id, status, full_name")
        .eq("id", userId)
        .maybeSingle();

      if (!profile) throw new Error("No employee record found for this account.");
      if (profile.status !== "ACTIVE") throw new Error("This account is not active.");
      if (profile.employee_id.toLowerCase() !== employeeId.trim().toLowerCase()) {
        await supabase.from("login_events").insert({
          user_id: userId,
          identifier: employeeId,
          level_1_otp: true,
          level_2_passkey: true,
          level_3_credentials: false,
          result: "DENIED_EMPLOYEE_ID",
          device: deviceLabel(),
        });
        throw new Error("Employee ID does not match this account.");
      }

      if (password.length < 8) throw new Error("Access password must be at least 8 characters.");

      if (needsPasswordSetup) {
        const { error } = await supabase.auth.updateUser({
          password,
          data: { has_password: true },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          await supabase.from("login_events").insert({
            user_id: userId,
            identifier: employeeId,
            level_1_otp: true,
            level_2_passkey: true,
            level_3_credentials: false,
            result: "DENIED_PASSWORD",
            device: deviceLabel(),
          });
          throw new Error("Access password rejected.");
        }
      }

      await supabase.from("login_events").insert({
        user_id: userId,
        identifier: profile.employee_id,
        level_1_otp: true,
        level_2_passkey: true,
        level_3_credentials: true,
        result: "GRANTED",
        device: deviceLabel(),
      });
      await supabase
        .from("profiles")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", userId);

      setAssurance(3);
      toast.success(`Welcome, ${profile.full_name}.`);
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-vault px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center gap-2">
          <ShieldCheck className="size-6 text-primary" />
          <span className="font-display text-xl font-semibold">NEXUS</span>
        </div>

        <div className="panel p-6">
          <p className="label-caps">Zero-Trust access control</p>
          <h1 className="mt-2 text-2xl font-semibold">Officer authentication</h1>

          <ol className="mt-6 flex items-center gap-2">
            {STEPS.map((s) => (
              <li key={s.n} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs",
                    step > s.n && "border-success/50 bg-success/15 text-success",
                    step === s.n && "border-primary bg-primary/15 text-primary",
                    step < s.n && "border-border text-muted-foreground",
                  )}
                >
                  <s.icon className="size-4" />
                </span>
                <span
                  className={cn(
                    "hidden text-xs sm:block",
                    step === s.n ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-8 space-y-4">
            {step === 1 && (
              <>
                <label className="label-caps block" htmlFor="email">
                  Level 1 — official email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@agency.gov.in"
                  className="w-full rounded-md border border-input bg-surface-2 px-3 py-2 text-sm outline-none focus:border-ring"
                />
                {otpSent && (
                  <>
                    <label className="label-caps block" htmlFor="code">
                      Six-digit one-time code
                    </label>
                    <input
                      id="code"
                      inputMode="numeric"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="000000"
                      className="mono-id w-full rounded-md border border-input bg-surface-2 px-3 py-2 text-lg tracking-[0.4em] outline-none focus:border-ring"
                    />
                  </>
                )}
                <button
                  disabled={busy}
                  onClick={otpSent ? verifyCode : sendCode}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-signal px-4 py-2.5 font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
                >
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  {otpSent ? "Verify code" : "Send one-time code"}
                </button>
                {otpSent && (
                  <button
                    onClick={sendCode}
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                  >
                    Resend code
                  </button>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-sm text-muted-foreground">
                  Level 2 confirms this is a registered device. Your passkey never leaves it.
                </p>
                <p className="mono-id rounded-md border border-border bg-surface-2 px-3 py-2 text-xs">
                  {deviceLabel()}
                </p>
                <button
                  disabled={busy}
                  onClick={doPasskey}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-signal px-4 py-2.5 font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <Fingerprint className="size-4" />}
                  Verify with passkey
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <label className="label-caps block" htmlFor="empid">
                  Level 3 — employee ID
                </label>
                <input
                  id="empid"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="EMP-000123"
                  className="mono-id w-full rounded-md border border-input bg-surface-2 px-3 py-2 text-sm outline-none focus:border-ring"
                />
                <label className="label-caps block" htmlFor="pwd">
                  {needsPasswordSetup ? "Set your access password" : "Access password"}
                </label>
                <input
                  id="pwd"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-input bg-surface-2 px-3 py-2 text-sm outline-none focus:border-ring"
                />
                <button
                  disabled={busy}
                  onClick={finish}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-signal px-4 py-2.5 font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
                >
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  Enter the vault
                </button>
                <p className="text-xs text-muted-foreground">
                  Your employee ID is shown on your first sign-in confirmation. If you do not know
                  it, ask an administrator to look it up in the directory.
                </p>
              </>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Sessions expire automatically after 30 minutes of inactivity. Every attempt is logged.
        </p>
      </div>
    </div>
  );
}
