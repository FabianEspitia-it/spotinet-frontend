"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [restoringSession, setRestoringSession] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function tryRestoreSession() {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });
        if (!cancelled && res.ok) {
          router.replace("/");
          router.refresh();
        }
      } catch {
        // Sin sesión restaurable: mostrar formulario de login.
      } finally {
        if (!cancelled) setRestoringSession(false);
      }
    }

    void tryRestoreSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(
          typeof data.error === "string" ? data.error : "No se pudo iniciar sesión"
        );
        return;
      }

      toast.success("Bienvenido");
      router.replace("/");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  if (restoringSession) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden">
        <div className="pointer-events-none absolute inset-0 z-0">
          <Image
            src="/images/fondo_spotinet.webp"
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
            quality={100}
          />
        </div>
        <p className="relative z-10 text-lg font-medium text-white">
          Restaurando sesión…
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Capa de fondo explícita: evita que el Image con fill quede encima del formulario y quita pointer-events en la foto */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/images/fondo_spotinet.webp"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          priority
          quality={100}
        />
      </div>

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-10">
        {/* Sin backdrop-blur: en Safari/WebKit suele dejar el contenido invisible sobre fondos complejos */}
        <div className="w-full max-w-md rounded-2xl border-2 border-secondary_blue bg-principal_blue/95 p-8 shadow-lg">
          <Image
            src="/images/final_logo.svg"
            alt="Spotinet"
            width={220}
            height={220}
            className="mx-auto mb-6"
          />
          <h1 className="mb-6 text-center text-xl font-semibold text-white">
            Iniciar sesión
          </h1>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <label className="block">
              <span className="mb-1 block text-sm text-secondary_blue">
                Correo
              </span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-secondary_blue/50 bg-principal_blue px-3 py-2 text-white placeholder:text-white/40 focus:border-secondary_blue focus:outline-none focus:ring-1 focus:ring-secondary_blue"
                placeholder="tu@correo.com"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-secondary_blue">
                Contraseña
              </span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-secondary_blue/50 bg-principal_blue px-3 py-2 text-white placeholder:text-white/40 focus:border-secondary_blue focus:outline-none focus:ring-1 focus:ring-secondary_blue"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-lg bg-secondary_blue py-3 font-semibold text-principal_blue transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
