"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { switchUser } from "@/lib/storage/auth";
import { readStore, seedStore } from "@/lib/storage/_store";

// Mapeo de grupos de Cognito a la ruta de destino
function destinationForGroups(groups: string[]): string {
  if (groups.includes("vp-sponsors")) return "/dashboard";
  if (groups.includes("area-transformacion")) return "/dashboard";
  if (groups.includes("business-owners")) return "/dashboard";
  if (groups.includes("product-owners")) return "/mis-iniciativas";
  if (groups.includes("scrum-masters")) return "/mis-iniciativas";
  return "/mis-iniciativas";
}

export default function AuthCallbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      // No redirigir al signIn — dejar que el usuario use el mock selector
      router.replace("/seleccionar-usuario");
      return;
    }

    if (status === "authenticated" && session?.user?.email) {
      const email = session.user.email;
      const groups = (session.user as { groups?: string[] }).groups ?? [];

      // Asegurar que el store tiene datos seed
      const store = readStore();
      if (store.users.length === 0) {
        seedStore();
      }

      // Buscar el usuario en el store por email
      const freshStore = readStore();
      const matchingUser = freshStore.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase(),
      );

      if (matchingUser) {
        switchUser(matchingUser.id);
        router.replace(destinationForGroups(groups));
      } else {
        // Usuario Cognito no encontrado en el store — ir al selector manual
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
