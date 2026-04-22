import { AppShell } from "@/components/shell/AppShell";

export default function GatewayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
