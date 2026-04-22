export default function GatewayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-pae-bg">{children}</div>;
}
