"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { setAdmin } from "@/lib/demo/store";

// Login de mentira: o demo não tem servidor. admin / admin liga o modo admin
// neste navegador.
export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("user") === "admin" && data.get("password") === "admin") {
      setAdmin(true);
      router.push("/");
    } else {
      setError("Usuário ou senha incorretos. No demo, use admin / admin.");
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-[18px]">
      <Input label="Usuário" name="user" autoComplete="username" placeholder="admin" required autoFocus />
      <Input label="Senha" type="password" name="password" autoComplete="current-password" placeholder="admin" required />
      {error && (
        <p role="alert" className="m-0 text-body-sm text-red-3">
          {error}
        </p>
      )}
      <Button type="submit" variant="primary" size="lg" fullWidth>
        Entrar
      </Button>
    </form>
  );
}
