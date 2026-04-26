import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../data/products'

export default function CartPage() {
  const { items, totalPrice, totalItems, dispatch } = useCart()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-24 h-24 rounded-full bg-panel border border-border flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
          </svg>
        </div>
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-white">Tu carrito está vacío</h2>
          <p className="text-muted mt-2">Explora nuestro catálogo y agrega productos</p>
        </div>
        <Link to="/" className="btn-primary">Ver productos</Link>
      </div>
    )
  }

  const shipping = totalPrice >= 500000 ? 0 : 25000
  const tax = Math.round(totalPrice * 0.19)
  const total = totalPrice + shipping + tax

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-black text-white">
            Carrito <span className="text-muted text-xl font-normal">({totalItems} items)</span>
          </h1>
          <button
            onClick={() => dispatch({ type: 'CLEAR' })}
            className="text-xs text-danger hover:text-danger/70 transition-colors font-mono"
          >
            Vaciar carrito
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items list */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            {items.map(item => (
              <div key={item.id} className="card p-4 flex gap-4 animate-fade-up">
                {/* Image */}
                <Link to={`/product/${item.id}`} className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono text-accent">{item.brand}</div>
                  <Link to={`/product/${item.id}`}>
                    <h3 className="font-display font-semibold text-white text-sm leading-snug hover:text-accent transition-colors truncate">
                      {item.name}
                    </h3>
                  </Link>
                  <div className="font-display font-bold text-white mt-1">
                    {formatPrice(item.price)}
                  </div>
                </div>

                {/* Qty + Remove */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_ITEM', id: item.id })}
                    className="text-muted hover:text-danger transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>

                  <div className="flex items-center border border-border rounded-lg overflow-hidden text-sm">
                    <button
                      onClick={() => dispatch({ type: 'UPDATE_QTY', id: item.id, qty: item.qty - 1 })}
                      className="w-8 h-8 flex items-center justify-center text-muted hover:text-white hover:bg-panel transition-colors"
                    >−</button>
                    <span className="w-8 text-center font-mono text-white">{item.qty}</span>
                    <button
                      onClick={() => dispatch({ type: 'UPDATE_QTY', id: item.id, qty: item.qty + 1 })}
                      className="w-8 h-8 flex items-center justify-center text-muted hover:text-white hover:bg-panel transition-colors"
                    >+</button>
                  </div>

                  <div className="text-xs text-muted font-mono">
                    = {formatPrice(item.price * item.qty)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="font-display font-bold text-white text-lg mb-5">Resumen del pedido</h2>

              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="text-white">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>IVA (19%)</span>
                  <span className="text-white">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Envío</span>
                  <span className={shipping === 0 ? 'text-success font-semibold' : 'text-white'}>
                    {shipping === 0 ? 'GRATIS' : formatPrice(shipping)}
                  </span>
                </div>

                {shipping > 0 && (
                  <div className="text-xs text-muted bg-surface rounded-lg p-3 border border-border">
                    Agrega {formatPrice(500000 - totalPrice)} más para envío gratis
                    <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${Math.min(100, (totalPrice / 500000) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-display font-bold text-white">Total</span>
                  <span className="font-display font-black text-white text-lg">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="btn-primary w-full mt-6 text-center justify-center flex items-center gap-2"
              >
                Proceder al pago
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>

              <Link to="/" className="btn-ghost w-full mt-3 text-sm text-center block">
                Seguir comprando
              </Link>

              <div className="mt-5 pt-4 border-t border-border">
                <div className="text-xs text-muted text-center font-mono">
                  🔒 Pago seguro con Stripe
                </div>
                <div className="mt-2 text-xs text-muted/60 text-center">
                  Tarjeta test: 4242 4242 4242 4242
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
