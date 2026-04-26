import { useParams, Link, useNavigate } from 'react-router-dom'
import { PRODUCTS, formatPrice, getDiscount } from '../data/products'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/ProductCard'
import { useState } from 'react'

export default function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { dispatch } = useCart()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const product = PRODUCTS.find(p => p.id === id)
  const related = PRODUCTS.filter(p => p.category === product?.category && p.id !== id).slice(0, 4)

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-muted">
        <div className="text-4xl">404</div>
        <p>Producto no encontrado</p>
        <Link to="/" className="btn-primary">Volver a la tienda</Link>
      </div>
    )
  }

  const discount = getDiscount(product.price, product.originalPrice)
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(product.rating))

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) dispatch({ type: 'ADD_ITEM', product })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-surface/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-xs text-muted">
          <Link to="/" className="hover:text-accent transition-colors">Tienda</Link>
          <span>/</span>
          <span className="capitalize">{product.category}</span>
          <span>/</span>
          <span className="text-white truncate max-w-xs">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden bg-panel border border-border">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
            {discount && (
              <div className="absolute top-4 left-4 badge bg-ember text-white text-sm px-3 py-1">
                -{discount}% OFF
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6 animate-fade-up">
            <div className="section-label m-0">{product.brand}</div>
            <h1 className="font-display text-3xl md:text-4xl font-black text-white leading-tight">{product.name}</h1>

            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {stars.map((filled, i) => (
                  <svg key={i} width="16" height="16" viewBox="0 0 12 12" className={filled ? 'text-amber-400' : 'text-border'} fill="currentColor">
                    <path d="M6 1l1.29 2.61 2.88.42-2.09 2.03.49 2.87L6 7.5 3.43 8.93l.49-2.87L1.83 4.03l2.88-.42L6 1z"/>
                  </svg>
                ))}
              </div>
              <span className="font-mono text-sm text-white">{product.rating}</span>
              <span className="text-sm text-muted">({product.reviews} reseñas)</span>
            </div>

            <div className="p-4 rounded-xl bg-panel border border-border">
              <div className="font-display text-4xl font-black text-white">{formatPrice(product.price)}</div>
              {product.originalPrice && (
                <div className="text-muted line-through text-sm mt-1">
                  {formatPrice(product.originalPrice)} · Ahorras {formatPrice(product.originalPrice - product.price)}
                </div>
              )}
            </div>

            <p className="text-muted leading-relaxed">{product.description}</p>

            <div className="flex flex-wrap gap-2">
              {product.tags.map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full border border-border text-muted text-xs font-mono">{tag}</span>
              ))}
            </div>

            <div className={`flex items-center gap-2 text-sm font-mono ${product.stock > 10 ? 'text-success' : product.stock > 0 ? 'text-amber-400' : 'text-danger'}`}>
              <div className={`w-2 h-2 rounded-full ${product.stock > 10 ? 'bg-success' : product.stock > 0 ? 'bg-amber-400' : 'bg-danger'}`} />
              {product.stock > 10 ? `En stock · ${product.stock} unidades` : product.stock > 0 ? `¡Solo quedan ${product.stock}!` : 'Agotado'}
            </div>

            {product.stock > 0 && (
              <div className="flex gap-3">
                <div className="flex items-center border border-border rounded-lg overflow-hidden bg-panel">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-muted hover:text-white hover:bg-surface transition-colors">−</button>
                  <span className="w-10 text-center font-mono text-sm text-white">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="w-10 h-10 flex items-center justify-center text-muted hover:text-white hover:bg-surface transition-colors">+</button>
                </div>
                <button
                  onClick={handleAdd}
                  className={`flex-1 font-display font-semibold px-6 py-3 rounded-lg transition-all duration-200 active:scale-95 ${added ? 'bg-success text-void' : 'bg-accent text-void hover:bg-accent-dim'}`}
                >
                  {added ? '✓ Agregado al carrito' : 'Agregar al carrito'}
                </button>
              </div>
            )}

            <button onClick={() => { if (!added) handleAdd(); navigate('/cart') }} className="btn-ghost text-sm" disabled={product.stock === 0}>
              Ir al carrito →
            </button>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="section-label m-0">También en {product.category}</div>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
