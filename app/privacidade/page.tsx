export const metadata = {
  title: 'Política de Privacidade — BUNS',
  description: 'Como tratamos os teus dados pessoais.',
};

export default function PrivacyPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-display mb-4">Política de Privacidade</h1>
      <div className="card p-6 space-y-4 text-white/80 leading-relaxed">
        <p>
          Valorizamos a tua privacidade. Esta página descreve, de forma simples, que
          dados recolhemos, porquê e por quanto tempo os guardamos.
        </p>
        <p>
          Recolhemos apenas o mínimo necessário para processar encomendas
          (ex.: nome, telefone, morada quando aplicável). Não vendemos dados a
          terceiros. Podes solicitar a eliminação dos teus dados a qualquer momento.
        </p>
        <p>
          Para questões relacionadas com proteção de dados, contacta-nos por email.
        </p>
      </div>
    </main>
  );
}
