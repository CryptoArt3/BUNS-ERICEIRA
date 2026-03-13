export default function ScreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh w-full overflow-hidden bg-black cursor-none select-none">
      {children}
    </div>
  );
}