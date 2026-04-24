"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { switchUser } from "@/lib/storage/auth";
import { writeStore } from "@/lib/storage/_store";
import type { Store } from "@/lib/storage/_store";

function destinationForGroups(groups: string[]): string {
  if (groups.includes("vp-sponsors")) return "/dashboard";
  if (groups.includes("area-transformacion")) return "/dashboard";
  if (groups.includes("business-owners")) return "/dashboard";
  return "/mis-iniciativas";
}

export default function AuthCallbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (status === "loading") return;
    if (handled.current) return;

    if (status === "unauthenticated") {
      handled.current = true;
      router.replace("/");
      return;
    }

    if (status === "authenticated" && session?.user?.email) {
      handled.current = true;
      const email = session.user.email;
      const groups = (session.user as { groups?: string[] }).groups ?? [];

      // Cargar datos desde la DB y escribir en localStorage
      fetch("/api/store")
        .then((res) => res.json())
        .then((store: Store) => {
          // Escribir el store completo en localStorage
          writeStore({ ...store, current_user_id: null });

          // Encontrar el usuario por email y activarlo
          const match = store.users.find(
            (u) => u.email.toLowerCase() === email.toLowerCase(),
          );

          if (match) {
            switchUser(match.id);
            router.replace(destinationForGroups(groups));
          } else {
            router.replace("/seleccionar-usuario");
          }
        })
        .catch(() => {
          // Si falla la DB, intentar con datos locales
          const { readStore, seedStore } = require("@/lib/storage/_store");
          const store = readStore();
          if (store.users.length === 0) seedStore();
          const freshStore = readStore();
          const match = freshStore.users.find(
            (u: { email: string }) => u.email.toLowerCase() === email.toLowerCase(),
          );
          if (match) {
            switchUser(match.id);
          }
          router.replace(destinationForGroups(groups));
        });
    }
  }, [session, status, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-pae-bg">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-pae-blue border-t-transparent" />
        <p className="mt-4 text-[14px] text-pae-text-secondary">
          Iniciando sesión…
        </p>
      </div>
    </main>
  );
}
