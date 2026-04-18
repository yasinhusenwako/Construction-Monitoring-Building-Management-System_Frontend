"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from '@/context/AuthContext';
import Image from "next/image";
import { useLanguage } from '@/context/LanguageContext';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { motion, AnimatePresence } from "motion/react";
import {
  Eye,
  EyeOff,
  AlertCircle,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Building2,
  Calendar,
  Wrench,
  ChevronDown,
  User,
  Phone,
  Building,
} from "lucide-react";

// Assets
import logoImg from "../../assets/f90b53223fdaa6590fb74226dca7ff83be56c9f0.png";
import heroImg from "../../assets/login-hero.png";

const ROLES = [
  { id: "admin", label: "Admin", email: "admin@cmbms.com" },
  { id: "user", label: "User", email: "user@cmbms.com" },
  {
    id: "supervisor",
    label: "Division Supervisor",
    email: "supervisor@cmbms.com",
  },
  { id: "professional", label: "Professional", email: "professional@cmbms.com" },
];

const REGISTER_STEPS = [
  "auth.stepPersonalInfo",
  "auth.stepAccountDetails",
  "auth.stepConfirmation",
];

interface AuthPageProps {
  initialMode?: "login" | "register";
}

export function AuthPage({ initialMode = "login" }: AuthPageProps) {
  const { login, register: registerUser } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<"login" | "register">(initialMode);

  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginRole, setLoginRole] = useState("user");
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Register State
  const [registerStep, setRegisterStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    role: "user" as "user" | "admin" | "supervisor" | "professional",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Sync mode with URL optionally or just handle internally
  useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "register" || m === "login") {
      setMode(m as any);
    }
  }, [searchParams]);

  // Auto-fill demo credentials in login mode
  useEffect(() => {
    if (mode === "login") {
        const selectedRole = ROLES.find((r) => r.id === loginRole);
        if (selectedRole) {
          setEmail(selectedRole.email);
          setPassword("password123");
        }
      }
  }, [loginRole, mode]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
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
    else setError(result.error || "Invalid credentials. Please try again.");
  };

  const updateRegisterForm = (k: string, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validateRegisterStep = () => {
    if (registerStep === 0) {
      if (!form.name.trim()) return "Full name is required.";
      if (!form.email.trim() || !form.email.includes("@"))
        return "Valid email is required.";
      if (!form.phone.trim()) return "Phone number is required.";
      if (!form.department.trim()) return "Department is required.";
    }
    if (registerStep === 1) {
      if (!form.password) return "Password is required.";
      if (form.password.length < 8)
        return "Password must be at least 8 characters.";
      if (form.password !== form.confirmPassword)
        return "Passwords do not match.";
    }
    return "";
  };

  const nextRegisterStep = () => {
    const err = validateRegisterStep();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setRegisterStep((s) => s + 1);
  };

  const handleRegisterSubmit = async () => {
    setError("");
    setLoading(true);
    const result = await registerUser({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      department: form.department,
      phone: form.phone,
    });
    setLoading(false);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } else {
      setError(result.error || "Registration failed.");
    }
  };

  const toggleMode = () => {
    setError("");
    setMode(mode === "login" ? "register" : "login");
    setRegisterStep(0);
    // Update URL without refreshing to keep context
    window.history.pushState(
      null,
      "",
      mode === "login" ? "/register" : "/login",
    );
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC] overflow-x-hidden">
      <div
        className={`flex w-full min-h-screen transition-all duration-700 ease-in-out ${mode === "register" ? "lg:flex-row-reverse" : "lg:flex-row"}`}
      >
        {/* ── BRANDING SIDEBAR ── */}
        <motion.section
          layout
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="hidden lg:flex lg:w-1/2 bg-[#1E3A8A] relative overflow-hidden flex-col p-12 text-white z-20 shadow-2xl"
        >
          {/* Decorative Background Elements */}
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col h-full">
            {/* Logo Section */}
            <div className="flex items-center gap-4 mb-20">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 shadow-xl shrink-0">
                <Image
                  src={logoImg}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight leading-none uppercase">
                  CMBMS
                </h2>
                <p className="text-[10px] text-blue-200 font-bold uppercase tracking-[0.2em] mt-1">
                  {t("auth.enterpriseSolution")}
                </p>
              </div>
            </div>

            {/* Value Prop Section */}
            <div className="space-y-8 flex-grow">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === "login" ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl xl:text-5xl font-black leading-[1.1] mb-6">
                  {mode === "login" ? (
                    <>
                      {t("auth.brandingLoginTitle")} <br />
                      <span className="text-orange-400">
                        & {t("auth.brandingLoginTitleHighlight")}
                      </span>
                    </>
                  ) : (
                    <>
                      {t("auth.brandingRegisterTitle")} <br />
                      <span className="text-orange-400">
                        {t("auth.brandingRegisterTitleHighlight")}
                      </span>{" "}
                      {t("auth.brandingRegisterTitleSuffix")}
                    </>
                  )}
                </h1>
                <p className="text-lg text-blue-100/80 max-w-md font-medium leading-relaxed">
                  {mode === "login"
                    ? t("auth.brandingLoginSubtitle")
                    : t("auth.brandingRegisterSubtitle")}
                </p>
              </motion.div>

              <div className="grid grid-cols-1 gap-4 pt-4">
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-300">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">
                      {t("auth.projectOversight")}
                    </h4>
                    <p className="text-[11px] text-blue-200">
                      {t("auth.projectOversightDesc")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">
                      {t("auth.spaceStrategy")}
                    </h4>
                    <p className="text-[11px] text-blue-200">
                      {t("auth.spaceStrategyDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Illustration Container */}
            <div className="mt-auto pt-5 relative">
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 bg-[#0c1a3f]">
                <Image
                  src={heroImg}
                  alt="Illustration"
                  className="w-full h-auto object-cover opacity-90"
                  priority
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0e2271] to-transparent h-24" />
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── FORM SIDE (Login or Register) ── */}
        <section className="flex-grow lg:w-1/2 flex flex-col bg-[#F8FAFC] min-h-screen relative z-10">
          {/* Top Navigation Controls */}
          <div className="p-6 flex items-center justify-between lg:justify-end gap-6">
            <div className="flex lg:hidden items-center gap-3">
              <div className="w-10 h-10 bg-white shadow-md rounded-lg p-1.5 overflow-hidden">
                <Image
                  src={logoImg}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-black text-[#1E3A8A]">CMBMS</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {t("auth.systemOperational")}
                </span>
              </div>
              <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
                <LanguageToggle />
                <ThemeToggle />
              </div>
            </div>
          </div>

          <div className="flex-grow flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
            <AnimatePresence mode="wait">
              {mode === "login" ? (
                /* LOGIN FORM */
                <motion.div
                  key="login-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full max-w-[420px]"
                >
                  <div className="mb-10 text-center lg:text-left">
                    <h2 className="text-3xl font-black text-[#0F172A] tracking-tight mb-3">
                      {t("auth.welcomeBack")}
                    </h2>
                    <p className="text-slate-500 font-medium">
                      {t("auth.pleaseLogin")}
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                    {error && (
                      <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-xl text-sm font-bold">
                        <AlertCircle size={18} className="shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <form onSubmit={handleLoginSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.1em] ml-1">
                          {t("auth.accessLevel")}
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1E3A8A] transition-colors">
                            <ShieldCheck size={18} />
                          </div>
                          <select
                            value={loginRole}
                            onChange={(e) => setLoginRole(e.target.value)}
                            className="w-full pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:border-[#1E3A8A] focus:ring-4 focus:ring-blue-100/50 transition-all appearance-none cursor-pointer"
                          >
                            {ROLES.map((r) => (
                              <option key={r.id} value={r.id}>
                                {t(`role.${r.id}`)}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <ChevronDown size={16} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.1em] ml-1">
                          {t("auth.email")}
                        </label>
                        <div
                          className={`relative flex items-center rounded-xl border transition-all duration-300 bg-white ${focusedField === "email" ? "border-[#1E3A8A] ring-4 ring-blue-100/50" : "border-slate-200 hover:border-slate-300"}`}
                        >
                          <div
                            className={`absolute left-4 ${focusedField === "email" ? "text-[#1E3A8A]" : "text-slate-400"}`}
                          >
                            <Mail size={18} />
                          </div>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={() => setFocusedField("email")}
                            onBlur={() => setFocusedField(null)}
                            placeholder={t("auth.enterEmail")}
                            className="w-full pl-12 pr-5 py-4 bg-transparent text-sm font-semibold outline-none text-slate-900"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.1em] leading-none">
                            {t("auth.password")}
                          </label>
                        </div>
                        <div
                          className={`relative flex items-center rounded-xl border transition-all duration-300 bg-white ${focusedField === "password" ? "border-[#1E3A8A] ring-4 ring-blue-100/50" : "border-slate-200 hover:border-slate-300"}`}
                        >
                          <div
                            className={`absolute left-4 ${focusedField === "password" ? "text-[#1E3A8A]" : "text-slate-400"}`}
                          >
                            <Lock size={18} />
                          </div>
                          <input
                            type={showPass ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setFocusedField("password")}
                            onBlur={() => setFocusedField(null)}
                            placeholder="••••••••"
                            className="w-full pl-12 pr-14 py-4 bg-transparent text-sm font-semibold outline-none text-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPass(!showPass)}
                            className="absolute right-4 text-slate-400 hover:text-[#1E3A8A]"
                          >
                            {showPass ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between px-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="peer sr-only"
                          />
                          <div className="w-5 h-5 border-2 border-slate-200 rounded-md peer-checked:bg-[#F59E0B] peer-checked:border-[#F59E0B] transition-all" />
                          <span className="text-[11px] font-bold text-slate-500 uppercase">
                            {t("auth.rememberMe")}
                          </span>
                        </label>
                        <Link
                          href="/forgot-password"
                          className="text-[11px] font-black text-[#F59E0B] uppercase hover:text-orange-600 transition-colors"
                        >
                          {t("auth.forgotPassword")}
                        </Link>
                      </div>

                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.01, backgroundColor: "#1c3577" }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 rounded-xl font-black text-sm transition-all bg-[#1E3A8A] text-white shadow-xl flex items-center justify-center gap-3"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            {t("auth.login")} <ArrowRight size={18} />
                          </>
                        )}
                      </motion.button>
                    </form>
                  </div>

                  <div className="mt-8 text-center">
                    <p className="text-slate-500 text-sm font-medium">
                      {t("auth.noAccount")}{" "}
                      <button
                        onClick={toggleMode}
                        className="text-[#1E3A8A] font-black hover:underline cursor-pointer"
                      >
                        {t("auth.register")}
                      </button>
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* REGISTER FORM */
                <motion.div
                  key="register-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="w-full max-w-[480px]"
                >
                  <div className="mb-10 text-center lg:text-left">
                    <h2 className="text-3xl font-black text-[#0F172A] tracking-tight mb-2">
                      {t("auth.register")}
                    </h2>
                    <p className="text-slate-500 font-medium">
                      {t("auth.joinInfrastructure")}
                    </p>
                  </div>

                  {/* Step Indicator */}
                  <div className="flex items-center gap-0 mb-10 overflow-hidden">
                    {REGISTER_STEPS.map((s, i) => (
                      <div key={s} className="flex items-center flex-1">
                        <div className="flex flex-col items-center relative z-10">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black border-2 transition-all shadow-sm ${i < registerStep ? "bg-[#1E3A8A] border-[#1E3A8A] text-white" : i === registerStep ? "bg-[#F59E0B] border-[#F59E0B] text-white" : "bg-white border-slate-200 text-slate-400"}`}
                          >
                            {i < registerStep ? (
                              <CheckCircle size={20} />
                            ) : (
                              i + 1
                            )}
                          </div>
                          <p
                            className={`text-[9px] mt-2 font-black uppercase tracking-wider absolute -bottom-6 whitespace-nowrap ${i === registerStep ? "text-[#1E3A8A]" : "text-slate-400"}`}
                          >
                            {t(s)}
                          </p>
                        </div>
                        {i < REGISTER_STEPS.length - 1 && (
                          <div
                            className={`flex-1 h-1 mx-2 transition-all rounded-full ${i < registerStep ? "bg-[#1E3A8A]" : "bg-slate-200"}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {error && (
                    <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-xl text-sm font-bold">
                      <AlertCircle size={18} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                    {registerStep === 0 && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                            {t("auth.fullName")}
                          </label>
                          <div className="relative flex items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
                            <User size={16} className="text-slate-400 mr-3" />
                            <input
                              value={form.name}
                              onChange={(e) =>
                                updateRegisterForm("name", e.target.value)
                              }
                              placeholder={t("auth.fullNamePlaceholder")}
                              className="w-full bg-transparent outline-none text-sm font-semibold"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                            {t("auth.email")}
                          </label>
                          <div className="relative flex items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
                            <Mail size={16} className="text-slate-400 mr-3" />
                            <input
                              type="email"
                              value={form.email}
                              onChange={(e) =>
                                updateRegisterForm("email", e.target.value)
                              }
                              placeholder={t("auth.email")}
                              className="w-full bg-transparent outline-none text-sm font-semibold"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                              {t("auth.phoneNumber")}
                            </label>
                            <div className="relative flex items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
                              <Phone
                                size={16}
                                className="text-slate-400 mr-3"
                              />
                              <input
                                value={form.phone}
                                onChange={(e) =>
                                  updateRegisterForm("phone", e.target.value)
                                }
                                placeholder={t("auth.phoneNumber")}
                                className="w-full bg-transparent outline-none text-sm font-semibold"
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                              {t("auth.department")}
                            </label>
                            <div className="relative flex items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
                              <Building
                                size={16}
                                className="text-slate-400 mr-3"
                              />
                              <input
                                value={form.department}
                                onChange={(e) =>
                                  updateRegisterForm(
                                    "department",
                                    e.target.value,
                                  )
                                }
                                placeholder={t("auth.department")}
                                className="w-full bg-transparent outline-none text-sm font-semibold"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {registerStep === 1 && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                            {t("auth.choosePassword")}
                          </label>
                          <div className="relative flex items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
                            <Lock size={16} className="text-slate-400 mr-3" />
                            <input
                              type={showPass ? "text" : "password"}
                              value={form.password}
                              onChange={(e) =>
                                updateRegisterForm("password", e.target.value)
                              }
                              placeholder={t("auth.choosePasswordPlaceholder")}
                              className="w-full bg-transparent outline-none text-sm font-semibold"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                            {t("auth.confirmPassword")}
                          </label>
                          <div className="relative flex items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
                            <Lock size={16} className="text-slate-400 mr-3" />
                            <input
                              type={showPass ? "text" : "password"}
                              value={form.confirmPassword}
                              onChange={(e) =>
                                updateRegisterForm(
                                  "confirmPassword",
                                  e.target.value,
                                )
                              }
                              placeholder={t("action.confirm")}
                              className="w-full bg-transparent outline-none text-sm font-semibold"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                            {t("auth.assignRole")}
                          </label>
                          <select
                            value={form.role}
                            onChange={(e) =>
                              updateRegisterForm("role", e.target.value)
                            }
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold outline-none appearance-none cursor-pointer"
                          >
                            <option value="user">{t("role.user")}</option>
                            <option value="supervisor">
                              {t("role.supervisor")}
                            </option>
                            <option value="professional">
                              {t("role.professional")}
                            </option>
                            <option value="admin">{t("role.admin")}</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {registerStep === 2 && (
                      <div className="space-y-4">
                        <div className="bg-[#1E3A8A]/5 border border-[#1E3A8A]/10 rounded-2xl p-6 space-y-3">
                          {[
                            ["Name", form.name],
                            ["Email", form.email],
                            ["Role", form.role.toUpperCase()],
                          ].map(([l, v]) => (
                            <div
                              key={l}
                              className="flex justify-between items-center"
                            >
                              <span className="text-[10px] font-black uppercase text-slate-400">
                                {l}
                              </span>
                              <span className="text-sm font-bold text-[#1E3A8A]">
                                {v}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest leading-relaxed">
                          {t("auth.protectedBy")}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-4 mt-8">
                      {registerStep > 0 && (
                        <button
                          onClick={() => setRegisterStep((s) => s - 1)}
                          className="flex-1 py-3 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {t("action.back")}
                        </button>
                      )}
                      <motion.button
                        onClick={
                          registerStep < 2
                            ? nextRegisterStep
                            : handleRegisterSubmit
                        }
                        disabled={loading}
                        whileHover={{ scale: 1.01, backgroundColor: "#1c3577" }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-[2] py-4 rounded-xl font-black text-sm transition-all bg-[#1E3A8A] text-white shadow-xl flex items-center justify-center gap-3"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            {registerStep < 2
                              ? t("auth.nextStep")
                              : t("auth.register")}{" "}
                            <ArrowRight size={18} />
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>

                  <div className="mt-8 text-center">
                    <p className="text-slate-500 text-sm font-medium">
                      {t("auth.alreadyHaveAccount")}{" "}
                      <button
                        onClick={toggleMode}
                        className="text-[#1E3A8A] font-black hover:underline cursor-pointer"
                      >
                        {t("auth.login")}
                      </button>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Copyright Section Container (matches login) */}
          <div className="pb-12 text-center mt-auto">
            <div className="inline-flex items-center gap-3 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              <div className="w-8 h-px bg-slate-200" />
              <span>{t("auth.authAccessOnly")}</span>
              <div className="w-8 h-px bg-slate-200" />
            </div>
            <p className="text-slate-400 text-xs font-medium">
              {t("auth.copyright")}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
