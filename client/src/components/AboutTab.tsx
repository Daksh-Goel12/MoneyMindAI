export default function AboutTab() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-primary-600 mb-4">About MoneyMind AI</h2>

      <p className="text-text mb-6 leading-relaxed">
        MoneyMind AI is a fintech assistant designed for everyday users and business owners.
        It helps you understand financial topics in plain, conversational language — no jargon,
        no confusion. Whether you're managing a household budget or running a small business,
        MoneyMind AI is here to help.
      </p>

      <h3 className="text-lg font-semibold text-primary-700 mb-3">What You Can Ask About</h3>
      <ul className="space-y-2 mb-6">
        {[
          { icon: '💰', label: 'Budgeting', desc: 'Create and manage monthly budgets, track spending, and build savings habits.' },
          { icon: '🏦', label: 'Loans', desc: 'Understand loan types, interest rates, repayment strategies, and refinancing.' },
          { icon: '📈', label: 'Investing', desc: 'Learn about stocks, bonds, mutual funds, risk management, and portfolio basics.' },
          { icon: '💳', label: 'Credit', desc: 'Improve your credit score, manage credit cards, and handle debt effectively.' },
          { icon: '🏢', label: 'Business Finance', desc: 'Cash flow management, bookkeeping, business credit, and financial planning.' },
        ].map((item) => (
          <li
            key={item.label}
            className="flex items-start gap-3 p-3 rounded-lg bg-primary-50 border border-primary-200"
          >
            <span className="text-xl flex-shrink-0">{item.icon}</span>
            <div>
              <p className="font-medium text-text">{item.label}</p>
              <p className="text-sm text-text-secondary">{item.desc}</p>
            </div>
          </li>
        ))}
      </ul>

      <h3 className="text-lg font-semibold text-primary-700 mb-3">How It Works</h3>
      <p className="text-text mb-4 leading-relaxed">
        MoneyMind AI uses a Retrieval-Augmented Generation (RAG) approach. When you ask a question,
        the system searches a curated knowledge base of fintech guides to find the most relevant
        information, then generates a clear, grounded response based on that content.
      </p>
      <p className="text-text mb-6 leading-relaxed">
        The knowledge base includes 4 curated guides covering personal finance, loans and credit,
        investment basics, and business finance essentials — totaling 29 expert-written sections.
        You can also upload your own PDF documents to extend the knowledge base with custom content.
      </p>

      <div className="p-4 rounded-lg bg-primary-100 border border-primary-300">
        <p className="text-sm text-text-secondary">
          Built with React, Node.js, Google Gemini 2.5, and FAISS vector search.
          Responses are grounded in retrieved knowledge base content for accuracy.
        </p>
      </div>
    </div>
  );
}
