import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Entrar o crear cuenta",
  description: "Accede a GameIndex para valorar juegos, escribir reseñas, crear listas y organizar tu biblioteca.",
  robots: { index: false, follow: true }
};

const benefits = [
  {
    title: "Tu biblioteca, ordenada",
    body: "Marca lo que juegas, lo que has terminado y lo que tienes pendiente.",
    icon: (
      <path d="M4 19.5V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14.5M4 19.5A1.5 1.5 0 0 0 5.5 21H20M4 19.5A1.5 1.5 0 0 1 5.5 18H20" />
    )
  },
  {
    title: "Valora y reseña",
    body: "Puntúa del 1 al 10 y comparte reseñas con la comunidad.",
    icon: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
  },
  {
    title: "Listas y recomendaciones",
    body: "Crea listas, sigue a otros jugadores y recibe sugerencias según tus gustos.",
    icon: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  }
];

export default function AuthPage() {
  return (
    <section className="container-page grid min-h-[calc(100vh-12rem)] items-center gap-10 py-10 lg:grid-cols-[1fr_440px] lg:gap-16">
      <div className="order-2 hidden lg:order-1 lg:block">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-electric">GameIndex</p>
        <h2 className="max-w-xl text-5xl font-black leading-[1.05] text-balance">
          Decide qué jugar después, <span className="text-electric">con criterio</span>.
        </h2>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
          Fichas completas, rankings de la comunidad y tu propio backlog en un mismo sitio.
        </p>
        <ul className="mt-10 grid max-w-lg gap-5">
          {benefits.map((benefit) => (
            <li key={benefit.title} className="flex gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-electric/30 bg-electric/10 text-blue-300">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {benefit.icon}
                </svg>
              </span>
              <span>
                <span className="block font-semibold">{benefit.title}</span>
                <span className="mt-0.5 block text-sm text-muted">{benefit.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="order-1 mx-auto w-full max-w-md lg:order-2 lg:max-w-none">
        <Suspense fallback={<div className="surface-card h-[520px] w-full animate-pulse rounded-3xl" />}>
          <AuthForm />
        </Suspense>
      </div>
    </section>
  );
}
