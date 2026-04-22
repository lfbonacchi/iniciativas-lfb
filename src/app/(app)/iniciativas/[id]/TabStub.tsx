export function TabStub({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-pae-surface p-8 text-center shadow-sm">
      <p className="text-[14px] font-semibold text-pae-text">{title}</p>
      <p className="mt-2 text-[12px] text-pae-text-secondary">{description}</p>
    </div>
  );
}
