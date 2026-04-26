export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface/50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-display font-bold text-white">
              Tienda<span className="text-accent">DDC</span>
            </div>
            <p className="text-xs text-muted mt-1">
              Arquitectura Centrada en Datos · React + Vite + Tailwind
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted">
            <span className="font-mono">v1.0.0</span>
            <span>·</span>
            <span>José Luis Campo Zúñiga</span>
            <span>·</span>
            <span>UnicomfaCauca 2026</span>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-border/50">
          <p className="text-xs text-muted/60 text-center font-mono">
            Demo académico — Tarjeta Stripe test: 4242 4242 4242 4242 · Exp: 12/28 · CVV: 123
          </p>
        </div>
      </div>
    </footer>
  )
}
