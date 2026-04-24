"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { switchUser } from "@/lib/storage/auth";
import { readStore, seedStore } from "@/lib/storage/_store";

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
    // Esperar a que la sesión esté resuelta
    if (status === "loading") return;
    // Evitar doble ejecución
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

      // Cargar seed si el store está vacío
      const store = readStore();
      if (store.users.length === 0) seedStore();

      // Buscar usuario por email
      const freshStore = readStore();
      const match = freshStore.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase(),
      );

      if (match) {
        switchUser(match.id);
        router.replace(destinationForGroups(groups));
      } else {
        // Email de Cognito no coincide con ningún usuario del store
        router.replace("/seleccionar-usuario");
      }
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
