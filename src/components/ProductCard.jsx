import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatPrice, getDiscount } from '../data/products'

export default function ProductCard({ product }) {
  const navigate = useNavigate()
  const { dispatch } = useCart()
  const [added, setAdded] = useState(false)
  const discount = getDiscount(product.price, product.originalPrice)

  const openProduct = () => {
    navigate(`/product/${product.id}`)
  }

  const handleCardKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openProduct()
    }
  }

  const handleAdd = (event) => {
    event.preventDefault()
    event.stopPropagation()
    dispatch({ type: 'ADD_ITEM', product })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(product.rating))

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={openProduct}
      onKeyDown={handleCardKeyDown}
      className="card group flex flex-col cursor-pointer animate-fade-up focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-surface">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-panel/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discount && (
            <span className="badge bg-ember/90 text-white backdrop-blur-sm">
              -{discount}%
            </span>
          )}
          {product.featured && (
            <span className="badge bg-accent/90 text-void backdrop-blur-sm">
              ★ Destacado
            </span>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <span className="badge bg-danger/20 text-danger border border-danger/30">
              ¡Últimas {product.stock}!
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Brand + Category */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-accent uppercase tracking-wider">{product.brand}</span>
          <span className="text-xs text-muted capitalize">{product.categoryLabel || product.category}</span>
        </div>

        {/* Name */}
        <h3 className="font-display font-semibold text-white text-sm leading-snug group-hover:text-accent transition-colors line-clamp-2">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {stars.map((filled, i) => (
              <svg key={i} width="12" height="12" viewBox="0 0 12 12" className={filled ? 'text-amber-400' : 'text-border'} fill="currentColor">
                <path d="M6 1l1.29 2.61 2.88.42-2.09 2.03.49 2.87L6 7.5 3.43 8.93l.49-2.87L1.83 4.03l2.88-.42L6 1z"/>
              </svg>
            ))}
          </div>
          <span className="text-xs text-muted">{product.rating} ({product.reviews})</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {product.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-border/60 text-muted font-mono">
              {tag}
            </span>
          ))}
        </div>

        {/* Price + Button */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
          <div>
            <div className="font-display font-bold text-white text-base">
              {formatPrice(product.price)}
            </div>
            {product.originalPrice && (
              <div className="text-xs text-muted line-through">
                {formatPrice(product.originalPrice)}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={product.stock === 0}
            className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all duration-200 active:scale-95 ${
              added
                ? 'bg-success/20 text-success border border-success/30'
                : product.stock === 0
                ? 'bg-border/40 text-muted cursor-not-allowed'
                : 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent hover:text-void'
            }`}
          >
            {added ? '✓ Agregado' : product.stock === 0 ? 'Agotado' : '+ Carrito'}
          </button>
        </div>
      </div>
    </article>
  )
}
