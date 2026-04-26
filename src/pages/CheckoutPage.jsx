import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../data/products'
import { useAdminData } from '../context/AdminDataContext'

const STEPS = ['Contacto', 'Envío', 'Pago', 'Confirmación']

const STRIPE_TEST = { number: '4242 4242 4242 4242', exp: '12/28', cvv: '123' }

export default function CheckoutPage() {
  const { items, totalPrice, totalItems, dispatch } = useCart()
  const { createOrder, storeSettings } = useAdminData()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [form, setForm] = useState({
    email: 'cliente@ejemplo.com',
    name: '',
    phone: '',
    address: '',
    city: 'Popayán',
    department: 'Cauca',
    zip: '190001',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardName: '',
  })
  const [errors, setErrors] = useState({})

  if (items.length === 0) {
    navigate('/')
    return null
  }

  const shipping = totalPrice >= storeSettings.freeShippingThreshold ? 0 : 25000
  const tax = Math.round(totalPrice * (storeSettings.taxRate / 100))
  const total = totalPrice + shipping + tax

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const formatCard = (val) => val.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19)
  const formatExpiry = (val) => {
    const v = val.replace(/\D/g, '').slice(0, 4)
    return v.length >= 3 ? v.slice(0, 2) + '/' + v.slice(2) : v
  }

  const validate = () => {
    const e = {}
    if (step === 0) {
      if (!form.email.includes('@')) e.email = 'Email inválido'
      if (!form.name.trim()) e.name = 'Requerido'
    }
    if (step === 1) {
      if (!form.address.trim()) e.address = 'Requerido'
      if (!form.city.trim()) e.city = 'Requerido'
    }
    if (step === 2) {
      if (form.cardNumber.replace(/\s/g, '').length < 16) e.cardNumber = 'Número de tarjeta inválido'
      if (!form.cardExpiry.includes('/')) e.cardExpiry = 'Formato: MM/AA'
      if (form.cardCvv.length < 3) e.cardCvv = 'CVV inválido'
      if (!form.cardName.trim()) e.cardName = 'Requerido'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (!validate()) return
    if (step < 2) { setStep(s => s + 1); return }
    // Simulate payment
    setLoading(true)
    setTimeout(async () => {
      try {
        await createOrder({ customer: form.email, total, items: totalItems })
        setStep(3)
        dispatch({ type: 'CLEAR' })
      } catch {
        setPaymentError('No fue posible confirmar la orden en este momento.')
      } finally {
        setLoading(false)
      }
    }, 2200)
  }

  const Field = ({ label, field, type = 'text', placeholder, transform, hint }) => (
    <div>
      <label className="block text-xs font-mono text-muted mb-1.5">{label}</label>
      <input
        type={type}
        value={form[field]}
        onChange={(e) => {
          const v = transform ? transform(e.target.value) : e.target.value
          setForm(f => ({ ...f, [field]: v }))
        }}
        placeholder={placeholder}
        className={`input-field ${errors[field] ? 'border-danger' : ''}`}
      />
      {errors[field] && <p className="text-xs text-danger mt-1">{errors[field]}</p>}
      {hint && !errors[field] && <p className="text-xs text-muted/60 mt-1 font-mono">{hint}</p>}
    </div>
  )

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="flex items-center gap-0 mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                  i < step ? 'bg-success text-void' :
                  i === step ? 'bg-accent text-void' :
                  'bg-border text-muted'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-body hidden sm:inline ${i === step ? 'text-white' : 'text-muted'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${i < step ? 'bg-success' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {step < 3 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="card p-6">
                {/* Step 0: Contact */}
                {step === 0 && (
                  <div className="flex flex-col gap-5 animate-fade-up">
                    <h2 className="font-display text-xl font-bold text-white">Información de contacto</h2>
                    <Field label="Email *" field="email" type="email" placeholder="tu@email.com" />
                    <Field label="Nombre completo *" field="name" placeholder="José Luis Campo" />
                    <Field label="Teléfono" field="phone" placeholder="+57 300 000 0000" />
                  </div>
                )}

                {/* Step 1: Shipping */}
                {step === 1 && (
                  <div className="flex flex-col gap-5 animate-fade-up">
                    <h2 className="font-display text-xl font-bold text-white">Dirección de envío</h2>
                    <Field label="Dirección *" field="address" placeholder="Calle 5 # 4-70" />
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Ciudad *" field="city" placeholder="Popayán" />
                      <Field label="Departamento" field="department" placeholder="Cauca" />
                    </div>
                    <Field label="Código postal" field="zip" placeholder="190001" />
                    {shipping === 0 && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm">
                        ✓ ¡Envío gratuito aplicado!
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Payment */}
                {step === 2 && (
                  <div className="flex flex-col gap-5 animate-fade-up">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-xl font-bold text-white">Datos de pago</h2>
                      <div className="flex items-center gap-1 text-xs text-accent font-mono">
                        🔒 Stripe Sandbox
                      </div>
                    </div>

                    {/* Test card hint */}
                    <div className="p-3 rounded-lg bg-accent/5 border border-accent/20 text-xs font-mono">
                      <div className="text-accent font-semibold mb-1">Tarjeta de prueba Stripe:</div>
                      <div className="text-muted space-y-0.5">
                        <div>Número: <span className="text-white">{STRIPE_TEST.number}</span></div>
                        <div>Vence: <span className="text-white">{STRIPE_TEST.exp}</span> · CVV: <span className="text-white">{STRIPE_TEST.cvv}</span></div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, cardNumber: STRIPE_TEST.number, cardExpiry: STRIPE_TEST.exp, cardCvv: STRIPE_TEST.cvv, cardName: form.name || 'JOSE LUIS CAMPO' }))}
                        className="mt-2 text-accent hover:underline"
                      >
                        → Autocompletar con datos de prueba
                      </button>
                    </div>

                    <Field
                      label="Número de tarjeta *"
                      field="cardNumber"
                      placeholder="4242 4242 4242 4242"
                      transform={formatCard}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Field
                        label="Vencimiento *"
                        field="cardExpiry"
                        placeholder="MM/AA"
                        transform={formatExpiry}
                      />
                      <Field label="CVV *" field="cardCvv" placeholder="123" />
                    </div>
                    <Field label="Nombre en la tarjeta *" field="cardName" placeholder="JOSE LUIS CAMPO" />
                  </div>
                )}

                {/* Navigation */}
                <div className="flex gap-3 mt-8 pt-5 border-t border-border">
                  {paymentError && (
                    <div className="w-full rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                      {paymentError}
                    </div>
                  )}
                  {step > 0 && (
                    <button onClick={() => setStep(s => s - 1)} className="btn-ghost">
                      ← Atrás
                    </button>
                  )}
                  <button
                    onClick={next}
                    disabled={loading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Procesando pago…
                      </>
                    ) : step === 2 ? `Pagar ${formatPrice(total)}` : 'Continuar →'}
                  </button>
                </div>
              </div>
            </div>

            {/* Order mini-summary */}
            <div>
              <div className="card p-5 sticky top-24">
                <h3 className="font-display font-semibold text-white mb-4">Tu pedido</h3>
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-2 text-sm">
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-xs font-medium truncate">{item.name}</div>
                        <div className="text-muted text-xs font-mono">×{item.qty} · {formatPrice(item.price * item.qty)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border mt-4 pt-4 space-y-2 text-xs text-muted">
                  <div className="flex justify-between"><span>Subtotal</span><span className="text-white">{formatPrice(totalPrice)}</span></div>
                  <div className="flex justify-between"><span>IVA 19%</span><span className="text-white">{formatPrice(tax)}</span></div>
                  <div className="flex justify-between"><span>Envío</span><span className={shipping === 0 ? 'text-success' : 'text-white'}>{shipping === 0 ? 'Gratis' : formatPrice(shipping)}</span></div>
                  <div className="flex justify-between font-display font-bold text-white text-sm pt-2 border-t border-border">
                    <span>Total</span><span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* SUCCESS */
          <div className="max-w-lg mx-auto text-center animate-fade-up">
            <div className="w-20 h-20 rounded-full bg-success/10 border border-success/30 flex items-center justify-center mx-auto mb-6">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <div className="section-label justify-center">Pago procesado · Stripe Sandbox</div>
            <h1 className="font-display text-4xl font-black text-white mt-3">¡Orden confirmada!</h1>
            <p className="text-muted mt-4 leading-relaxed">
              Tu pago fue procesado exitosamente. Recibirás un correo de confirmación en <span className="text-accent font-mono">{form.email}</span>
            </p>

            {/* Order details */}
            <div className="card p-5 mt-8 text-left">
              <div className="text-xs font-mono text-muted mb-3">DETALLES DEL PEDIDO</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted">Número de orden</span><span className="text-accent font-mono">#DDC-{Math.random().toString(36).slice(2,8).toUpperCase()}</span></div>
                <div className="flex justify-between"><span className="text-muted">Total pagado</span><span className="text-white font-bold">{formatPrice(total)}</span></div>
                <div className="flex justify-between"><span className="text-muted">Envío a</span><span className="text-white">{form.city}, {form.department}</span></div>
                <div className="flex justify-between"><span className="text-muted">Tiempo estimado</span><span className="text-white">3–5 días hábiles</span></div>
              </div>
            </div>

            <button onClick={() => navigate('/')} className="btn-primary mt-6 w-full">
              Volver a la tienda
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
