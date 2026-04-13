import { Suspense } from "react";
import { RegisterPage } from "../pages/auth/RegisterPage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterPage />
    </Suspense>
  );
}
