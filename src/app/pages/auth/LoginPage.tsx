"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import Image from "next/image";
import { useLanguage } from "../../context/LanguageContext";
import { ThemeToggle } from "../../components/common/ThemeToggle";
import { LanguageToggle } from "../../components/common/LanguageToggle";
import { motion, AnimatePresence } from "motion/react";
import {
  Eye,
  EyeOff,
  AlertCircle,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  Wrench,
} from "lucide-react";
import logoImg from "@/assets/f90b53223fdaa6590fb74226dca7ff83be56c9f0.png";
import buildingImg from "@/assets/insa-building.png";

const BG_IMAGE = buildingImg.src;

const MODULES = [
  {
    icon: Building2,
    label: "Projects & Design",
    color: "#6C9BDC",
  },
  {
    icon: Calendar,
    label: "Space Allocation & Booking",
    color: "#A78BFA",
  },
  {
    icon: Wrench,
    label: "Maintenance",
    color: "#F87171",
  },
];

const QUICK_ROLES = [
  {
    role: "admin" as const,
    label: "Admin",
    icon: "🛡️",
    accent: "#6C9BDC",
    email: "admin@insa.gov.et",
  },
  {
    role: "user" as const,
    label: "User",
    icon: "👤",
    accent: "#FCD34D",
    email: "user@insa.gov.et",
  },
  {
    role: "supervisor" as const,
    label: "Division",
    icon: "📋",
    accent: "#A78BFA",
    email: "supervisor@insa.gov.et",
  },
  {
    role: "professional" as const,
    label: "Professional",
    icon: "🔧",
    accent: "#F87171",
    email: "tech@insa.gov.et",
  },
];

/* Floating orb */
function Orb({
  x,
  y,
  size,
  color,
  delay,
}: {
  x: string;
  y: string;
  size: number;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        background: color,
        filter: "blur(60px)",
        opacity: 0.25,
      }}
      animate={{ y: [0, -24, 0], scale: [1, 1.08, 1] }}
      transition={{
        duration: 7 + delay,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState(0);

  // Cycle active module for visual effect
  useEffect(() => {
    const id = setInterval(
      () => setActiveModule((p) => (p + 1) % MODULES.length),
      2800,
    );
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) router.push("/dashboard");
    else setError(result.error || "Login failed.");
  };

  const quickLogin = async (
    role: "admin" | "user" | "supervisor" | "professional",
  ) => {
    const creds = {
      admin: {
        email: "admin@insa.gov.et",
        password: "password123",
      },
      user: {
        email: "user@insa.gov.et",
        password: "password123",
      },
      supervisor: {
        email: "supervisor@insa.gov.et",
        password: "password123",
      },
      professional: {
        email: "tech@insa.gov.et",
        password: "password123",
      },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
    setError("");
    setLoading(true);
    const result = await login(creds[role].email, creds[role].password);
    setLoading(false);
    if (result.success) router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-[#060d1f]">
      {/* ══════════════════════════════════════════
          LEFT PANEL — Immersive Hero
      ══════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${BG_IMAGE})` }}
        />
        {/* Deep gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#060d1f]/55 via-[#0e2271]/35 to-[#060d1f]/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060d1f]/80 via-transparent to-transparent" />

        {/* Animated orbs */}
        <Orb x="10%" y="15%" size={320} color="#1A3580" delay={0} />
        <Orb x="60%" y="50%" size={260} color="#F5B800" delay={2} />
        <Orb x="20%" y="70%" size={200} color="#CC1F1A" delay={4} />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-14 py-12">
          {/* Top Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/90 shadow-lg shadow-black/30 border border-white/60 flex items-center justify-center p-1.5">
              <Image
                src={logoImg}
                alt="INSA"
                className="w-9 h-9 object-contain"
              />
            </div>
            <div>
              <p className="text-white font-semibold text-sm tracking-wide">
                INSA
              </p>
              <p className="text-white/70 text-xs tracking-wide">
                INSA CMBMS Portal
              </p>
            </div>
          </div>

          {/* Center Block */}
          <div className="flex-1 flex flex-col justify-center max-w-md">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 mb-6 w-fit"
            >
              <ShieldCheck size={12} className="text-[#F5B800]" />
              <span className="text-white/80 text-[11px] font-medium tracking-wider uppercase">
                Government-Grade Security
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white mb-4"
              style={{
                fontSize: "2.5rem",
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
              }}
            >
              {t("app.title")}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-blue-200/70 text-sm mb-8 leading-relaxed"
            >
              {t("app.subtitle")}
            </motion.p>

            {/* Module List */}
            <div className="space-y-2">
              {MODULES.map((mod, i) => {
                const Icon = mod.icon;
                const isActive = activeModule === i;
                return (
                  <motion.div
                    key={mod.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 + i * 0.08 }}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 border"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      borderColor: isActive
                        ? mod.color + "55"
                        : "rgba(255,255,255,0.08)",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: mod.color + "25" }}
                    >
                      <Icon size={15} style={{ color: mod.color }} />
                    </div>
                    <span className="text-sm font-medium text-white/85">
                      {mod.label}
                    </span>
                    <div
                      className="ml-auto w-2 h-2 rounded-full"
                      style={{
                        background: isActive
                          ? mod.color
                          : "rgba(255,255,255,0.25)",
                      }}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Bottom tagline */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <p className="text-white/30 text-xs tracking-[0.2em] uppercase">
              {t("app.tagline")}
            </p>
            <div className="flex-1 h-px bg-white/10" />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT PANEL — Login Form
      ══════════════════════════════════════════ */}
      <div className="flex-1 lg:max-w-[500px] flex flex-col bg-background dark:bg-background relative">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5">
            <Image
              src={logoImg}
              alt="INSA"
              className="w-8 h-8 object-contain"
            />
            <span className="font-bold text-primary text-sm">INSA CMBMS</span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-8 py-10 overflow-y-auto">
          <motion.div
            className="w-full max-w-[380px]"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {/* Heading */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-1.5 bg-primary/10 dark:bg-primary/20 rounded-full px-3 py-1 mb-4">
                <ShieldCheck size={12} className="text-primary" />
                <span className="text-primary text-xs font-semibold tracking-wide uppercase">
                  {t("auth.securePortal")}
                </span>
              </div>
              <h2
                className="text-foreground mb-2"
                style={{
                  fontSize: "1.9rem",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                }}
              >
                {t("auth.welcomeBack")} 👋
              </h2>
              <p className="text-muted-foreground text-sm">
                {t("auth.signInPrompt")}
              </p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  className="flex items-center gap-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 rounded-2xl px-4 py-3 mb-5 text-sm"
                >
                  <AlertCircle size={15} className="flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-2">
                  {t("auth.email")}
                </label>
                <div
                  className={`relative flex items-center rounded-2xl border transition-all duration-200 ${
                    focusedField === "email"
                      ? "border-primary shadow-[0_0_0_3px] shadow-primary/15 bg-card dark:bg-card"
                      : "border-border bg-muted/30 dark:bg-muted/20 hover:border-border/80"
                  }`}
                >
                  <div
                    className={`absolute left-4 transition-colors duration-200 ${focusedField === "email" ? "text-primary" : "text-muted-foreground"}`}
                  >
                    <Mail size={15} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="your.email@insa.gov.et"
                    className="w-full pl-11 pr-4 py-3.5 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground/60 rounded-2xl"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                    {t("auth.password")}
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    {t("auth.forgotPassword")}
                  </Link>
                </div>
                <div
                  className={`relative flex items-center rounded-2xl border transition-all duration-200 ${
                    focusedField === "password"
                      ? "border-primary shadow-[0_0_0_3px] shadow-primary/15 bg-card dark:bg-card"
                      : "border-border bg-muted/30 dark:bg-muted/20 hover:border-border/80"
                  }`}
                >
                  <div
                    className={`absolute left-4 transition-colors duration-200 ${focusedField === "password" ? "text-primary" : "text-muted-foreground"}`}
                  >
                    <Lock size={15} />
                  </div>
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your password"
                    className="w-full pl-11 pr-12 py-3.5 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground/60 rounded-2xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="relative w-full py-3.5 rounded-2xl overflow-hidden font-semibold text-sm transition-all disabled:opacity-60 mt-2 group"
                style={{
                  background: "linear-gradient(135deg, #1A3580, #0E2271)",
                  color: "white",
                  boxShadow: "0 8px 24px rgba(26,53,128,0.35)",
                }}
              >
                {/* Shine sweep */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background:
                      "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)",
                  }}
                />
                {loading ? (
                  <span className="flex items-center justify-center gap-2.5">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t("auth.signingIn")}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {t("auth.login")}
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground/60 font-medium px-1">
                {t("auth.demoQuickLogin")}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Quick Login Pills */}
            <div className="grid grid-cols-4 gap-2.5">
              {QUICK_ROLES.map(
                ({ role, label, icon, accent, email: roleEmail }) => (
                  <motion.button
                    key={role}
                    onClick={() => quickLogin(role)}
                    disabled={loading}
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex flex-col items-center gap-2 py-3.5 px-2 rounded-2xl text-xs font-semibold transition-all disabled:opacity-60 border group"
                    style={{
                      borderColor: accent + "30",
                      background: accent + "08",
                    }}
                  >
                    <span
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all group-hover:scale-110"
                      style={{
                        background: accent + "20",
                        border: `1px solid ${accent}30`,
                      }}
                    >
                      {icon}
                    </span>
                    <span style={{ color: accent }}>{label}</span>
                  </motion.button>
                ),
              )}
            </div>

            {/* Register link */}
            <p className="text-center text-xs text-muted-foreground mt-7">
              {t("auth.noAccount")}{" "}
              <Link
                href="/register"
                className="text-primary font-semibold hover:underline"
              >
                {t("auth.register")}
              </Link>
            </p>

            {/* Security note */}
            <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground/40">
              <Lock size={10} />
              <p className="text-xs">{t("auth.protectedBy")}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
