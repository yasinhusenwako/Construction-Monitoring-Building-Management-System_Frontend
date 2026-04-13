import { Suspense } from "react";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPasswordPage />
    </Suspense>
  );
}
