"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import logoImg from "@/assets/f90b53223fdaa6590fb74226dca7ff83be56c9f0.png";
import Image from "next/image";
import { apiRequest } from "@/lib/api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await apiRequest<{ message: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: { email },
      });
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to process password reset request.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #0E2271 0%, #3162C8 100%)",
      }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <Image
            src={logoImg}
            alt="INSA"
            className="w-10 h-10 object-contain"
          />
          <div>
            <p className="font-bold text-[#0E2271]">INSA CMBMS</p>
            <p className="text-xs text-muted-foreground">Password Recovery</p>
          </div>
        </div>

        {!sent ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#0E2271]">
                Forgot Password?
              </h2>
              <p className="text-muted-foreground text-sm mt-2">
                Enter your registered email address and we'll send you
                instructions to reset your password.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0E2271] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@insa.gov.et"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none focus:ring-2 focus:ring-[#1A3580]/20 focus:border-[#1A3580] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-all disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #0E2271, #1A3580)",
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending Reset Link...
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-[#0E2271] mb-2">
              Check Your Email
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              We've sent password reset instructions to <strong>{email}</strong>
              . Check your inbox and spam folder.
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-left text-sm text-[#1A3580]">
              <p className="font-medium mb-1">Didn't receive the email?</p>
              <ul className="text-xs space-y-1 text-blue-700 list-disc list-inside">
                <li>Check your spam/junk folder</li>
                <li>Make sure the email address is correct</li>
                <li>Wait a few minutes and try again</li>
              </ul>
            </div>
            <button
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
              className="mt-4 text-sm text-[#1A3580] hover:underline"
            >
              Try a different email
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-border">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-[#1A3580] hover:underline"
          >
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
