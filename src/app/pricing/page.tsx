'use client'
// src/app/pricing/page.tsx — Subscription tiers
import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const FEATURES = {
  free: {
    name: 'Free',
    subtitle: 'Free forever',
    price: { monthly: 0, yearly: 0 },
    color: 'var(--text-gold)',
    border: 'rgba(201,168,76,0.40)',
    bg: 'rgba(201,168,76,0.06)',
    badge: null,
    features: [
      '✓ Unlimited chart calculations',
      '✓ All 41 varga divisional charts',
      '✓ Full Dasha Suite: Vimśottarī, Yoginī, Chara & Aṣṭottarī',
      '✓ Shadbala & Viṁśopaka planetary strength',
      '✓ Aṣṭakavarga (SAV + BAV) & Āruḍha Lagnas',
      '✓ Automatic detection of 100+ Graha Yogas',
      '✓ Daily Pañcāṅga & Muhūrta Windows',
      '✓ Solar Return (Varṣaphal) analysis',
      '✓ Basic Relationship Compatibility & Comparison',
      '✓ Nakshatra Suite: Navtara, Remedies & Analysis',
      '✓ Interpretation Layer: Headlines & Key Insights',
      '✓ Transit Overlays on Rashi & Houses',
      '✓ Save up to 10 consultation records',
      '✓ Public chart sharing with links',
    ],
  },
  gold: {
    name: 'Gold',
    subtitle: 'For serious students',
    price: { monthly: 299, yearly: 2499 },
    color: 'var(--accent)',
    border: 'rgba(139,124,246,0.50)',
    bg: 'rgba(139,124,246,0.08)',
    badge: 'Most Popular',
    features: [
      '✓ Everything in Free',
      '✓ Unlimited chart saves and library',
      '✓ Professional PDF & HTML exports',
      '✓ Dasha Precision: Start from Ascendant or any Planet',
      '✓ Full Aṣṭakūṭa Compatibility (36-point matching)',
      '✓ Chart Notes, Annotations & Tags',
      '✓ Bulk Data Import (CSV/JSON)',
      '✓ Priority Ephemeris computation',
      '✓ Advanced Muhūrta filtering',
      '✓ Email chart reports to clients',
      '✓ Early API access (100 req/day)',
    ],
  },
  platinum: {
    name: 'Platinum',
    subtitle: 'For professionals',
    price: { monthly: 999, yearly: 8499 },
    color: 'var(--teal)',
    border: 'rgba(78,205,196,0.50)',
    bg: 'rgba(78,205,196,0.08)',
    badge: 'Professional',
    features: [
      '✓ Everything in Gold',
      '✓ White-labeling: Use your own brand/logo on shares',
      '✓ Client Management Dashboard',
      '✓ Rare Conditional Daśā systems',
      '✓ Custom Ayanamsha & Sidereal offsets',
      '✓ Bulk PDF export for collections',
      '✓ Enterprise API Access (10k req/day)',
      '✓ Priority technical support',
      '✓ Early access to prediction algorithms',
    ],
  },
}

const FAQ = [
  { q: 'Is Free really free forever?', a: 'Yes. The Free tier is permanently free with no credit card required. We believe core Jyotish tools should be accessible to everyone.' },
  { q: 'What payment methods are accepted?', a: 'We accept all major credit/debit cards, UPI, net banking, and wallets via Razorpay. International cards also accepted.' },
  { q: 'Can I cancel anytime?', a: 'Yes, subscriptions can be cancelled at any time. Your access continues until the end of the billing period.' },
  { q: 'Is there a student discount?', a: 'Yes — students and Jyotish teachers get 40% off Gold. Email us at support@vedaansh.com with your credentials.' },
  { q: 'Do you offer refunds?', a: 'We offer a 7-day money-back guarantee on all paid plans if you are not satisfied.' },
]

export default function PricingPage() {
  const { data: session } = useSession()
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)  // plan key being loaded
  const [checkoutError,  setCheckoutError]  = useState<string | null>(null)

  const currentPlan = (session?.user as any)?.plan ?? 'free'

  // ── Razorpay checkout ────────────────────────────────────────
  async function handleSubscribe(planKey: 'gold' | 'platinum') {
    if (!session) {
      window.location.href = '/login?callbackUrl=/pricing'
      return
    }
    setCheckoutLoading(planKey)
    setCheckoutError(null)

    try {
      // 1. Create order on server
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey, interval: billing }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error ?? 'Order creation failed')

      // 2. Load Razorpay script if not already present
      await loadRazorpayScript()

      // 3. Open Razorpay modal
      const rzp = new (window as any).Razorpay({
        key:         data.keyId,
        amount:      data.amount,
        currency:    data.currency,
        order_id:    data.orderId,
        name:        'Vedaansh',
        description: `${data.planLabel} — ${billing} subscription`,
        prefill: {
          name:  data.userName,
          email: data.userEmail,
        },
        theme: { color: planKey === 'gold' ? '#8B7CF6' : '#4ECDC4' },
        handler: async function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
          // 4. Verify payment signature + activate subscription via webhook
          //    (webhook handles plan upgrade asynchronously)
          //    Show a success message immediately on payment capture
          await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentId:  response.razorpay_payment_id,
              orderId:    response.razorpay_order_id,
              signature:  response.razorpay_signature,
              plan:       planKey,
              interval:   billing,
            }),
          })
          window.location.href = '/account?upgraded=1'
        },
        modal: {
          ondismiss: () => setCheckoutLoading(null),
        },
      })
      rzp.open()

    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
      setCheckoutLoading(null)
    }
  }

  function loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).Razorpay) { resolve(); return }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'))
      document.head.appendChild(script)
    })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>

      {/* Header */}
      <header style={{ padding: '0 2rem', height: '3.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 50, background: 'var(--header-bg)', borderBottom: '1px solid var(--border-soft)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <span>🪐</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-gold)' }}>Vedaansh</span>
        </Link>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {session ? (
            <Link href="/account" style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
              My Account
            </Link>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm">Sign In</Link>
          )}
          <ThemeToggle />
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: 1100, width: '100%', margin: '0 auto', padding: 'clamp(2rem,5vw,4rem) clamp(1rem,3vw,2rem)', display: 'flex', flexDirection: 'column', gap: '3rem', alignItems: 'center' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', maxWidth: 600 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-gold)', fontFamily: 'var(--font-display)', marginBottom: '0.75rem' }}>
            Simple, transparent pricing
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.15, margin: '0 0 1rem 0' }}>
            Professional Jyotiṣa.<br />
            <span style={{ color: 'var(--text-gold)' }}>Free to start.</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Swiss Ephemeris precision for every chart. All core features free forever on the Free tier.
          </p>
        </div>

        {/* Billing toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--surface-2)', padding: '0.3rem', borderRadius: 99, border: '1px solid var(--border)' }}>
          {(['monthly', 'yearly'] as const).map(b => (
            <button key={b} onClick={() => setBilling(b)} style={{
              padding: '0.4rem 1.25rem', borderRadius: 99, cursor: 'pointer', border: 'none',
              fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: billing === b ? 700 : 400,
              background: billing === b ? 'var(--surface-1)' : 'transparent',
              color: billing === b ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: billing === b ? 'var(--shadow-card)' : 'none',
              transition: 'all 0.15s',
            }}>
              {b === 'monthly' ? 'Monthly' : 'Yearly'}
              {b === 'yearly' && (
                <span style={{ marginLeft: 6, fontSize: '0.68rem', color: 'var(--teal)', fontWeight: 700 }}>Save 30%</span>
              )}
            </button>
          ))}
        </div>

        {/* Tier cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', width: '100%' }}>
          {(Object.entries(FEATURES) as [string, typeof FEATURES.free][]).map(([key, tier]) => {
            const isCurrent = currentPlan === key
            const price = tier.price[billing as 'monthly' | 'yearly']
            const isGold = key === 'gold'

            return (
              <div key={key} style={{
                background: isGold ? 'var(--surface-1)' : 'var(--surface-1)',
                border: `1px solid ${isGold ? tier.border : 'var(--border)'}`,
                borderTop: `3px solid ${tier.color}`,
                borderRadius: 'var(--r-lg)',
                padding: '1.75rem',
                display: 'flex', flexDirection: 'column', gap: '1.25rem',
                position: 'relative',
                boxShadow: isGold ? '0 4px 24px rgba(139,124,246,0.12)' : 'none',
              }}>
                {/* Popular badge */}
                {tier.badge && (
                  <div style={{
                    position: 'absolute', top: -1, right: 20,
                    padding: '0.2rem 0.75rem',
                    background: tier.color, color: '#fff',
                    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', fontFamily: 'var(--font-display)',
                    borderRadius: '0 0 var(--r-sm) var(--r-sm)',
                  }}>
                    {tier.badge}
                  </div>
                )}

                {/* Plan name */}
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700, color: tier.color, marginBottom: 2 }}>
                    {tier.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                    {tier.subtitle}
                  </div>
                </div>

                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                  {price === 0 ? (
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Free
                    </span>
                  ) : (
                    <>
                      <span style={{ fontSize: '1rem', color: 'var(--text-muted)', alignSelf: 'flex-start', marginTop: 8 }}>₹</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {billing === 'yearly' ? Math.round(tier.price.yearly / 12) : tier.price.monthly}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                        /month
                      </span>
                    </>
                  )}
                </div>
                {billing === 'yearly' && price > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--teal)', fontFamily: 'var(--font-display)', marginTop: -8 }}>
                    ₹{tier.price.yearly}/year — save ₹{(tier.price.monthly * 12) - tier.price.yearly}
                  </div>
                )}

                {/* CTA */}
                {isCurrent ? (
                  <div style={{
                    padding: '0.6rem 1rem', textAlign: 'center',
                    background: tier.bg, border: `1px solid ${tier.border}`,
                    borderRadius: 'var(--r-md)',
                    fontFamily: 'var(--font-display)', fontSize: '0.85rem',
                    fontWeight: 600, color: tier.color,
                  }}>
                    ✓ Current Plan
                  </div>
                ) : price === 0 ? (
                  <Link href="/" style={{
                    display: 'block', padding: '0.65rem 1rem', textAlign: 'center',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)', textDecoration: 'none',
                    fontFamily: 'var(--font-display)', fontSize: '0.85rem',
                    fontWeight: 600, color: 'var(--text-secondary)',
                  }}>
                    Get Started Free →
                  </Link>
                ) : currentPlan === key ? (
                  <div style={{
                    display: 'block', padding: '0.65rem 1rem', textAlign: 'center',
                    background: 'var(--surface-3)', borderRadius: 'var(--r-md)',
                    fontFamily: 'var(--font-display)', fontSize: '0.85rem',
                    fontWeight: 600, color: 'var(--text-muted)',
                  }}>
                    ✓ Current plan
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleSubscribe(key as 'gold' | 'platinum')}
                      disabled={checkoutLoading === key}
                      style={{
                        display: 'block', width: '100%', padding: '0.65rem 1rem',
                        textAlign: 'center', background: tier.color,
                        borderRadius: 'var(--r-md)', textDecoration: 'none',
                        fontFamily: 'var(--font-display)', fontSize: '0.85rem',
                        fontWeight: 700, color: '#fff', border: 'none',
                        cursor: checkoutLoading === key ? 'not-allowed' : 'pointer',
                        opacity: checkoutLoading === key ? 0.75 : 1,
                        transition: 'opacity 0.15s',
                      }}
                    >
                      {checkoutLoading === key
                        ? 'Opening checkout…'
                        : `Upgrade to ${tier.name} →`}
                    </button>
                    {checkoutError && checkoutLoading === null && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-danger)', marginTop: '0.4rem', textAlign: 'center' }}>
                        {checkoutError}
                      </p>
                    )}
                  </>
                )}

                {/* Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-soft)', paddingTop: '1rem' }}>
                  {tier.features.map((f, i) => (
                    <div key={i} style={{
                      fontSize: '0.82rem',
                      fontFamily: 'var(--font-display)',
                      color: f.startsWith('—') ? 'var(--text-muted)' : 'var(--text-secondary)',
                      display: 'flex', gap: '0.35rem', alignItems: 'flex-start',
                    }}>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Trust signals */}
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { icon: '🔒', text: 'Secure payments via Razorpay' },
            { icon: '↩', text: '7-day money-back guarantee' },
            { icon: '❌', text: 'Cancel anytime, no lock-in' },
            { icon: '🪐', text: 'Swiss Ephemeris precision' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
              <span>{icon}</span> {text}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ width: '100%', maxWidth: 680 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', marginBottom: '1.5rem' }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {FAQ.map(({ q, a }, i) => (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', padding: '0.9rem 1.1rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--surface-1)', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-display)', fontSize: '0.88rem',
                    fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left',
                  }}
                >
                  {q}
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', flexShrink: 0, marginLeft: 8 }}>
                    {openFaq === i ? '▲' : '▼'}
                  </span>
                </button>
                {openFaq === i && (
                  <div style={{
                    padding: '0.9rem 1.1rem',
                    background: 'var(--surface-2)',
                    fontFamily: 'var(--font-display)', fontSize: '0.84rem',
                    color: 'var(--text-secondary)', lineHeight: 1.65,
                    borderTop: '1px solid var(--border-soft)',
                  }}>
                    {a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{
          textAlign: 'center', padding: '2rem',
          background: 'linear-gradient(135deg, rgba(201,168,76,0.07), rgba(139,124,246,0.07))',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)', maxWidth: 540, width: '100%',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Start with Free — free forever
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic', marginBottom: '1.25rem' }}>
            No credit card. No expiry. Upgrade when you&apos;re ready.
          </div>
          <Link href="/" className="btn btn-primary" style={{ padding: '0.65rem 2rem' }}>
            Calculate My Chart →
          </Link>
        </div>

      </main>

      <footer style={{ padding: '1.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.8rem', borderTop: '1px solid var(--border-soft)' }}>
        Vedaansh · <span style={{ color: 'var(--text-gold)' }}>Jyotiṣa Platform</span> · All prices in INR · GST applicable
      </footer>
    </div>
  )
}
