export const metadata = {
  title: 'Termos & Condições — BUNS',
  description: 'Regras de utilização do serviço e do website.',
};

export default function TermsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-display mb-4">Termos & Condições</h1>
      <div className="card p-6 space-y-4 text-white/80 leading-relaxed">
        <p>
          Ao utilizar o nosso site e efetuar encomendas, aceitas estes termos. Os
          preços podem ser atualizados sem aviso. Em caso de dúvida ou problema com a
          encomenda, fala connosco — tentamos sempre resolver rapidamente.
        </p>
        <p>
          O conteúdo deste site (texto, imagens e marca BUNS) está protegido. Não é
          permitida a sua cópia ou reutilização sem autorização.
        </p>
      </div>
    </main>
  );
}
