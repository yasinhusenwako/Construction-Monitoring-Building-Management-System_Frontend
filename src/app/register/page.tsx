import { Suspense } from "react";
import { RegisterPage } from '@/views/auth/RegisterPage';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterPage />
    </Suspense>
  );
}
