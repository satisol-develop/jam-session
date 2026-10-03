import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-neutral-500">Cargando…</div>}>
      <LoginForm />
    </Suspense>
  );
}
