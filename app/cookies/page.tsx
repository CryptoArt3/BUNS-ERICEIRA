export const metadata = {
  title: 'Política de Cookies — BUNS',
  description: 'Informação sobre cookies utilizados no website.',
};

export default function CookiesPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-display mb-4">Política de Cookies</h1>
      <div className="card p-6 space-y-4 text-white/80 leading-relaxed">
        <p>
          Usamos cookies técnicos para manter o carrinho e melhorar a experiência.
          Podes desativá-los no navegador, mas algumas funcionalidades podem deixar
          de funcionar corretamente.
        </p>
      </div>
    </main>
  );
}
