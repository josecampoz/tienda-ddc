import { useState, useMemo } from 'react'
import { CATEGORIES } from '../data/products'
import ProductCard from '../components/ProductCard'
import { useAdminData } from '../context/AdminDataContext'

export default function HomePage() {
  const { products } = useAdminData()
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('featured')

  const filtered = useMemo(() => {
    let list = products

    if (activeCategory !== 'all') {
      list = list.filter(p => p.category === activeCategory)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      )
    }

    switch (sort) {
      case 'price-asc':  return [...list].sort((a, b) => a.price - b.price)
      case 'price-desc': return [...list].sort((a, b) => b.price - a.price)
      case 'rating':     return [...list].sort((a, b) => b.rating - a.rating)
      case 'featured':   return [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
      default:           return list
    }
  }, [activeCategory, search, sort, products])

  const featured = products.filter(p => p.featured).slice(0, 3)
  const inStockRate = products.length > 0 ? Math.round((products.filter((p) => p.stock > 0).length / products.length) * 100) : 0

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-surface grid-bg border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-ember/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="max-w-2xl animate-fade-up">
            <div className="section-label">TiendaOnline DDC · Arquitectura Centrada en Datos</div>
            <h1 className="font-display text-5xl md:text-6xl font-black text-white leading-none tracking-tight mt-4">
              Tecnología
              <br />
              <span className="text-accent">de vanguardia</span>
            </h1>
            <p className="text-muted text-lg mt-6 leading-relaxed max-w-xl">
              Los mejores productos tech con la arquitectura de software más moderna.
              Cada compra genera datos en tiempo real.
            </p>

            {/* Stats */}
            <div className="flex gap-8 mt-10">
              {[
                { label: 'Productos', value: products.length },
                { label: 'Categorías', value: '5' },
                { label: 'Stock disponible', value: `${inStockRate}%` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="font-display text-2xl font-bold text-white">{value}</div>
                  <div className="text-xs text-muted mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      </section>

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="section-label m-0">Destacados</div>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger">
          {featured.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Catalog */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        {/* Filters bar */}
        <div className="bg-panel border border-border rounded-xl p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar productos, marcas, características..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-9 text-sm"
              />
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="input-field w-full md:w-48 text-sm appearance-none cursor-pointer"
            >
              <option value="featured">Destacados primero</option>
              <option value="rating">Mejor calificados</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
            </select>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-body transition-all duration-200 ${
                  activeCategory === cat.id
                    ? 'bg-accent text-void font-semibold'
                    : 'bg-surface border border-border text-muted hover:border-accent/50 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted">
            <span className="text-white font-semibold">{filtered.length}</span> productos encontrados
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-xs text-muted hover:text-accent transition-colors"
            >
              ✕ Limpiar búsqueda
            </button>
          )}
        </div>

        {/* Product Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-muted text-lg">Sin resultados para "{search}"</p>
            <button
              onClick={() => { setSearch(''); setActiveCategory('all') }}
              className="btn-ghost mt-4 text-sm"
            >
              Ver todos los productos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  )
}
