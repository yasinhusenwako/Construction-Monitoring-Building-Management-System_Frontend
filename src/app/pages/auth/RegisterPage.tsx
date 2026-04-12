"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  User,
  Mail,
  Lock,
  Phone,
  Building,
  Shield,
} from "lucide-react";
import logoImg from "@/assets/f90b53223fdaa6590fb74226dca7ff83be56c9f0.png";

const steps = ["Personal Info", "Account Details", "Confirmation"];

export function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    role: "user" as "user" | "admin" | "supervisor" | "professional",
    password: "",
    confirmPassword: "",
  });

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validateStep = () => {
    if (step === 0) {
      if (!form.name.trim()) return "Full name is required.";
      if (!form.email.trim() || !form.email.includes("@"))
        return "Valid email is required.";
      if (!form.phone.trim()) return "Phone number is required.";
      if (!form.department.trim()) return "Department is required.";
    }
    if (step === 1) {
      if (!form.password) return "Password is required.";
      if (form.password.length < 8)
        return "Password must be at least 8 characters.";
      if (form.password !== form.confirmPassword)
        return "Passwords do not match.";
    }
    return "";
  };

  const nextStep = () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    const result = await register({
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

  if (success)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0E2271, #3162C8)" }}
      >
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full mx-4">
          <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#0E2271] mb-2">
            Account Created!
          </h2>
          <p className="text-muted-foreground text-sm">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #0E2271 0%, #3162C8 100%)",
      }}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Image
            src={logoImg}
            alt="INSA"
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="font-bold text-[#0E2271]">INSA CMBMS</h1>
            <p className="text-xs text-muted-foreground">Create Your Account</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-0 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${
                    i < step
                      ? "bg-[#1A3580] border-[#1A3580] text-white"
                      : i === step
                        ? "bg-[#F5B800] border-[#F5B800] text-gray-900"
                        : "bg-gray-100 border-gray-200 text-gray-400"
                  }`}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <p
                  className={`text-xs mt-1 font-medium ${i === step ? "text-[#1A3580]" : "text-muted-foreground"}`}
                >
                  {s}
                </p>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mt-[-12px] transition-all ${i < step ? "bg-[#1A3580]" : "bg-gray-200"}`}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 0: Personal Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#0E2271] mb-4">
              Personal Information
            </h2>
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Abebe Girma"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none focus:ring-2 focus:ring-[#1A3580]/20 focus:border-[#1A3580]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="abebe@insa.gov.et"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none focus:ring-2 focus:ring-[#1A3580]/20 focus:border-[#1A3580]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                Phone Number *
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+251 911 000 000"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none focus:ring-2 focus:ring-[#1A3580]/20 focus:border-[#1A3580]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                Department *
              </label>
              <div className="relative">
                <Building
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  value={form.department}
                  onChange={(e) => update("department", e.target.value)}
                  placeholder="e.g. Network Operations"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none focus:ring-2 focus:ring-[#1A3580]/20 focus:border-[#1A3580]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                Role *
              </label>
              <div className="relative">
                <Shield
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <select
                  value={form.role}
                  onChange={(e) => update("role", e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none focus:ring-2 focus:ring-[#1A3580]/20 focus:border-[#1A3580] appearance-none"
                >
                  <option value="user">User (Standard)</option>
                  <option value="supervisor">Division Supervisor</option>
                  <option value="professional">Professional</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Account Details */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#0E2271] mb-4">
              Set Your Password
            </h2>
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none focus:ring-2 focus:ring-[#1A3580]/20 focus:border-[#1A3580]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      form.password.length >= i * 2
                        ? "bg-[#1A3580]"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0E2271] mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type={showPass ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  placeholder="Repeat password"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none focus:ring-2 focus:ring-[#1A3580]/20 focus:border-[#1A3580]"
                />
              </div>
              {form.confirmPassword &&
                form.password !== form.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    Passwords do not match
                  </p>
                )}
              {form.confirmPassword &&
                form.password === form.confirmPassword && (
                  <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                    <CheckCircle size={12} /> Passwords match
                  </p>
                )}
            </div>
          </div>
        )}

        {/* Step 2: Confirmation */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-[#0E2271] mb-4">
              Confirm Your Details
            </h2>
            <div className="bg-secondary rounded-xl p-4 space-y-3 text-sm">
              {[
                ["Full Name", form.name],
                ["Email", form.email],
                ["Phone", form.phone],
                ["Department", form.department],
                [
                  "Role",
                  form.role.charAt(0).toUpperCase() + form.role.slice(1),
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-[#0E2271]">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              By creating an account, you agree to INSA's usage policies and
              data protection guidelines.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button
              onClick={() => {
                setError("");
                setStep((s) => s - 1);
              }}
              className="flex-1 py-2.5 rounded-lg border-2 border-[#1A3580] text-[#1A3580] text-sm font-semibold hover:bg-secondary transition-colors"
            >
              Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              onClick={nextStep}
              className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold transition-all"
              style={{
                background: "linear-gradient(135deg, #0E2271, #1A3580)",
              }}
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold transition-all disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #0E2271, #1A3580)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[#1A3580] font-medium hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
