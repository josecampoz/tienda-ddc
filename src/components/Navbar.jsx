import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useState } from 'react'

const NAV = [
  { to: '/', label: 'Tienda' },
  { to: '/admin', label: 'Admin' },
]

export default function Navbar() {
  const { totalItems } = useCart()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-void/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center glow-accent">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M2 8h8M2 12h10" stroke="#080A0F" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-display font-bold text-lg text-white tracking-tight">
            Tienda<span className="text-accent">DDC</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-4 py-2 rounded-lg font-body text-sm transition-all duration-200 ${
                pathname === to
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-muted hover:text-white hover:bg-panel'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Cart */}
        <div className="flex items-center gap-3">
          <Link
            to="/cart"
            className="relative flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-panel transition-colors group"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted group-hover:text-white transition-colors">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span className="text-sm text-muted group-hover:text-white transition-colors hidden sm:inline">
              Carrito
            </span>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-ember rounded-full text-white text-xs font-mono font-bold flex items-center justify-center animate-fade-in">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="md:hidden p-2 rounded-lg hover:bg-panel text-muted hover:text-white transition-colors"
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-surface animate-fade-in">
          {NAV.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-3 text-sm font-body border-b border-border/50 transition-colors ${
                pathname === to ? 'text-accent bg-accent/5' : 'text-muted hover:text-white hover:bg-panel'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
