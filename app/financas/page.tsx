// app/financas/page.tsx
import FinanceTracker from "./_components/FinanceTracker";

export const metadata = {
  title: "BUNS • Finanças",
  description: "Registo privado de faturação diária (local).",
};

export default function FinancasPage() {
  return (
    <main className="relative mx-auto max-w-5xl px-4 py-10 sm:py-12">
      <FinanceTracker />
    </main>
  );
}
