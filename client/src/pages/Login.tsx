import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, Phone, Shield, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { setStoredUserId, getStoredUserId, getAuthHeaders } from "@/lib/auth-utils";
import logoImg from "@/assets/logo.png";

type Step = "phone" | "otp" | "name";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("phone");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(120);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const fullPhone = `${countryCode}${phone}`;

  const handleSendOtp = async () => {
    if (phone.replace(/\D/g, "").length < 10) {
      toast({ title: "Enter a valid 10-digit phone number", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: fullPhone }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDevOtp(data.code);
      setStep("otp");
      startCountdown();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
      toast({ title: "OTP sent!", description: "Enter the code below." });
    } catch (err: any) {
      toast({ title: err.message || "Failed to send OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      toast({ title: "Enter the complete 6-digit OTP", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: fullPhone, code }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const user = data.user;
      if (user?.id) {
        setStoredUserId(user.id);
        setVerifiedUserId(user.id);
      }
      // If user has a generic name (just created), ask for their name
      const isNew = !user.firstName || user.firstName === "User";
      if (isNew) {
        setStep("name");
      } else {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        setLocation("/");
      }
    } catch (err: any) {
      toast({ title: err.message || "Verification failed", variant: "destructive" });
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  const handleSetName = async () => {
    if (!name.trim()) {
      toast({ title: "Please enter your name", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const parts = name.trim().split(" ");
      const firstName = parts[0];
      const lastName = parts.slice(1).join(" ") || "";
      const storedId = getStoredUserId() || verifiedUserId;
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          firstName,
          lastName,
          userId: storedId,
          phoneNumberFallback: fullPhone,
        }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      if (data.id) {
        setStoredUserId(data.id);
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    } catch (err: any) {
      toast({ title: err.message || "Failed to save name", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-xl scale-150" />
            <img
              src={logoImg}
              alt="Zenix"
              className="relative w-20 h-20 rounded-3xl shadow-2xl shadow-primary/30"
            />
          </div>
          <h1 className="mt-4 text-3xl font-display font-bold text-foreground">Zenix</h1>
          <p className="text-muted-foreground text-sm mt-1">Secure messaging, always</p>
        </div>

        <div className="bg-background/80 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl p-6">

          {/* STEP 1 — Enter phone number */}
          {step === "phone" && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="inline-flex p-3 bg-primary/10 rounded-2xl mb-3">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Enter your number</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  We'll send you a one-time password
                </p>
              </div>

              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-24 px-2 py-3 rounded-xl bg-secondary border border-border text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                  data-testid="select-country-code"
                >
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+61">🇦🇺 +61</option>
                  <option value="+971">🇦🇪 +971</option>
                  <option value="+65">🇸🇬 +65</option>
                  <option value="+60">🇲🇾 +60</option>
                  <option value="+880">🇧🇩 +880</option>
                  <option value="+92">🇵🇰 +92</option>
                  <option value="+94">🇱🇰 +94</option>
                  <option value="+977">🇳🇵 +977</option>
                </select>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border text-base font-medium outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  data-testid="input-phone"
                  autoFocus
                />
              </div>

              <button
                onClick={handleSendOtp}
                disabled={loading || phone.replace(/\D/g, "").length < 10}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-base shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="button-send-otp"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send OTP"}
              </button>

              <p className="text-center text-xs text-muted-foreground">
                By continuing, you agree to our{" "}
                <a href="/terms" className="text-primary hover:underline">Terms</a> and{" "}
                <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
              </p>
            </div>
          )}

          {/* STEP 2 — Enter OTP */}
          {step === "otp" && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setStep("phone");
                    setOtp(["", "", "", "", "", ""]);
                    setDevOtp(null);
                    if (countdownRef.current) clearInterval(countdownRef.current);
                    setCountdown(0);
                  }}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold">Verify OTP</h2>
                  <p className="text-sm text-muted-foreground">
                    Sent to {countryCode} {phone}
                  </p>
                </div>
              </div>

              {devOtp && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                      Demo Mode — No SMS sent
                    </p>
                    <p className="text-3xl font-mono font-black tracking-[0.3em] text-amber-700 dark:text-amber-300 mt-1">
                      {devOtp}
                    </p>
                    <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-0.5">
                      Expires in {formatCountdown(countdown)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-center">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                      const newOtp = [...otp];
                      pasted.split("").forEach((char, idx) => {
                        if (idx < 6) newOtp[idx] = char;
                      });
                      setOtp(newOtp);
                      otpRefs.current[Math.min(pasted.length, 5)]?.focus();
                    }}
                    className="w-11 h-14 text-center text-xl font-bold rounded-xl bg-secondary border-2 border-border focus:border-primary focus:bg-primary/5 outline-none transition-all"
                    data-testid={`input-otp-${i}`}
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.join("").length !== 6}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-base shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="button-verify-otp"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Verify & Continue"
                )}
              </button>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Resend OTP in{" "}
                    <span className="font-bold text-primary">{formatCountdown(countdown)}</span>
                  </p>
                ) : (
                  <button
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="text-sm font-bold text-primary hover:underline disabled:opacity-50"
                    data-testid="button-resend-otp"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3 — Set name (new users) */}
          {step === "name" && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="inline-flex p-3 bg-green-500/10 rounded-2xl mb-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <h2 className="text-xl font-bold">Welcome to Zenix!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  What should we call you?
                </p>
              </div>

              <input
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSetName()}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-base font-medium outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                data-testid="input-name"
                autoFocus
              />

              <button
                onClick={handleSetName}
                disabled={loading || !name.trim()}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-base shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="button-save-name"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Get Started →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
