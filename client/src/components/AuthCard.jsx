import { WalletCards } from 'lucide-react';

export function AuthCard({ title, subtitle, children }) {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand-lockup">
          <span className="brand-mark">
            <WalletCards size={24} />
          </span>
          <div>
            <strong>Pocket Ledger</strong>
            <span>Receipts, rent, and the rest</span>
          </div>
        </div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {children}
      </section>
    </main>
  );
}
