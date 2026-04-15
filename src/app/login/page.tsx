import { Suspense } from "react";
import { LoginPage } from '@/views/auth/LoginPage';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}
