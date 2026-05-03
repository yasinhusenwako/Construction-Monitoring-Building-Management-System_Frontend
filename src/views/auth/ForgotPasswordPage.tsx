"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import logoImg from "@/assets/f90b53223fdaa6590fb74226dca7ff83be56c9f0.png";
import Image from "next/image";

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

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
            <p className="font-bold text-[#0E2271]">INSA CSBMS</p>
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
                Password resets are managed by Keycloak. Use the sign-in page
                and click "Forgot password" to start the reset flow.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSent(true)}
              className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-all"
              style={{
                background: "linear-gradient(135deg, #0E2271, #1A3580)",
              }}
            >
              I understand
            </button>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-[#0E2271] mb-2">
              Reset Via Keycloak
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              Return to the sign-in page and use the "Forgot password" link.
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-left text-sm text-[#1A3580]">
              <p className="font-medium mb-1">Need help?</p>
              <ul className="text-xs space-y-1 text-blue-700 list-disc list-inside">
                <li>Verify your account exists in Keycloak</li>
                <li>Contact an admin if the reset option is unavailable</li>
              </ul>
            </div>
            <button
              onClick={() => {
                setSent(false);
              }}
              className="mt-4 text-sm text-[#1A3580] hover:underline"
            >
              Back
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
