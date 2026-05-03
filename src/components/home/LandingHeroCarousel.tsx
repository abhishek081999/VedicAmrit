'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState, type MouseEvent } from 'react'

type HeroSlide = {
  id: string
  kicker: string
  title: string
  desc: string
  accent: string
  bullets: string[]
  cta: { label: string; href?: string; action?: 'openAstrology' | 'openMyChart' }
  visual: { emoji: string; title: string; text: string }
}

type LandingHeroCarouselProps = {
  trackLandingCta: (ctaName: string) => void
  onOpenAstrology: () => void
  onOpenMyChart: () => void
  showMyChart: boolean
  withChartGate: (href: string, e?: MouseEvent<HTMLElement>) => void
}

const AUTO_MS = 5600

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'astrology',
    kicker: 'Astrology Workspace',
    title: 'Charts, dashas, guidance — one workspace',
    desc: 'Kundali through vargas and dasha layers in a single focused flow.',
    accent: '#c9a84c',
    bullets: ['D1–D60 & vargas', 'Consultation-ready'],
    cta: { label: 'Open Astrology', action: 'openAstrology' },
    visual: { emoji: '🧿', title: 'Rishi lens', text: 'Classical rules, modern UX.' },
  },
  {
    id: 'prashna',
    kicker: 'Prashna Engine',
    title: 'Clear answers for timely questions',
    desc: 'Structured Prashna when you need a direct read on a decision.',
    accent: '#8b7cf6',
    bullets: ['Focused flow', 'Timing cues'],
    cta: { label: 'Open Prashna', href: '/prashna' },
    visual: { emoji: '📜', title: 'Scripture lens', text: 'Vedic framing for your query.' },
  },
  {
    id: 'panchang',
    kicker: 'Daily Panchang',
    title: 'Today’s tithi, nakṣatra, muhūrta',
    desc: 'Pañcāṅga signals and day-level timing at a glance.',
    accent: '#2f9e8f',
    bullets: ['Rahu Kaal & yogas', 'Day factors'],
    cta: { label: 'Open Panchang', href: '/panchang' },
    visual: { emoji: '🕉️', title: 'Daily rhythm', text: 'Align actions with the day.' },
  },
  {
    id: 'calendar',
    kicker: 'Vedic Calendar',
    title: 'Month view — stronger dates first',
    desc: 'Scan festivals and windows before you lock a day.',
    accent: '#e07a5f',
    bullets: ['Monthly grid', 'Festival context'],
    cta: { label: 'Open Calendar', href: '/panchang/calendar' },
    visual: { emoji: '🪔', title: 'Sacred timing', text: 'Intentional milestones.' },
  },
  {
    id: 'compare',
    kicker: 'Kundali Matching',
    title: 'Match two charts — Aṣṭakūṭa & more',
    desc: 'Ashtakoot scoring, dosha checks, and side-by-side charts without loading a saved natal first.',
    accent: '#c084fc',
    bullets: ['36-point Guna Milan', 'Dual birth forms'],
    cta: { label: 'Open Kundali Matching', href: '/compare' },
    visual: { emoji: '⚭', title: 'Two souls', text: 'Compatibility in one flow.' },
  },
]

export function LandingHeroCarousel({
  trackLandingCta,
  onOpenAstrology,
  onOpenMyChart,
  showMyChart,
  withChartGate,
}: LandingHeroCarouselProps) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReducedMotion(media.matches)
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (reducedMotion || paused) return
    const timer = window.setInterval(() => {
      setActive((prev) => (prev + 1) % HERO_SLIDES.length)
    }, AUTO_MS)
    return () => window.clearInterval(timer)
  }, [paused, reducedMotion])

  const slide = HERO_SLIDES[active]

  const quickLinks = useMemo(
    () => [
      { label: 'Astrology', href: '/astrology?new=true' },
      { label: 'Prashna', href: '/prashna' },
      { label: 'Panchang', href: '/panchang' },
      { label: 'Calendar', href: '/panchang/calendar' },
      { label: 'Kundali Matching', href: '/compare' },
    ],
    [],
  )

  const handleSlideCta = () => {
    if (slide.cta.action === 'openAstrology') {
      trackLandingCta(`hero_${slide.id}_open_astrology`)
      onOpenAstrology()
      return
    }
    if (slide.cta.action === 'openMyChart') {
      trackLandingCta(`hero_${slide.id}_open_my_chart`)
      onOpenMyChart()
    }
  }

  return (
    <section
      className={`card landing-hero-carousel ${paused ? 'is-paused' : ''} ${reducedMotion ? 'reduced-motion' : ''}`}
      style={{ marginBottom: '1rem', ['--hero-auto-ms' as string]: `${AUTO_MS}ms`, ['--hero-accent' as string]: slide.accent }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-label="Vedaansh product highlights"
    >
      <div className="landing-hero-carousel-progress-wrap" aria-hidden="true">
        <div key={`progress-${active}`} className="landing-hero-carousel-progress" />
      </div>

      <div className="landing-hero-carousel-inner">
        <div className="landing-hero-carousel-top">
          <div className="landing-hero-carousel-brand">
            <Image src="/veda-icon.png" alt="Vedaansh" width={26} height={26} />
            <span>Vedaansh</span>
          </div>
          <span className="landing-hero-carousel-pause-hint">{paused ? 'Paused' : 'Auto slider'}</span>
        </div>

        <div className="landing-hero-carousel-stage">
          <article className="landing-hero-carousel-slide is-active" style={{ ['--slide-accent' as string]: slide.accent }}>
            <div className="landing-hero-carousel-slide-bg" />
            <div className="landing-hero-carousel-copy">
              <p className="landing-hero-carousel-kicker">{slide.kicker}</p>
              <h1 className="landing-hero-carousel-title">{slide.title}</h1>
              <p className="landing-hero-carousel-desc">{slide.desc}</p>

              <ul className="landing-hero-carousel-bullets">
                {slide.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <div className="landing-hero-carousel-cta">
                {slide.cta.action ? (
                  <button type="button" className="btn btn-primary landing-hero-carousel-primary" onClick={handleSlideCta}>
                    {slide.cta.label}
                  </button>
                ) : (
                  <Link
                    href={slide.cta.href ?? '/astrology?new=true'}
                    className="btn btn-primary landing-hero-carousel-primary"
                    onClick={(e) => {
                      trackLandingCta(`hero_${slide.id}_cta`)
                      withChartGate(slide.cta.href ?? '/astrology?new=true', e as unknown as MouseEvent<HTMLElement>)
                    }}
                    style={{ textDecoration: 'none' }}
                  >
                    {slide.cta.label}
                  </Link>
                )}
              </div>
            </div>

            <aside className="landing-hero-vedic-art">
              <div className="landing-hero-vedic-art-symbol">{slide.visual.emoji}</div>
              <h3>{slide.visual.title}</h3>
              <p>{slide.visual.text}</p>
            </aside>
          </article>
        </div>

        <div className="landing-hero-carousel-nav">
          <div className="landing-hero-carousel-tabs" role="tablist" aria-label="Hero modules">
            {HERO_SLIDES.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={idx === active}
                className={`landing-hero-carousel-tab ${idx === active ? 'is-active' : ''}`}
                onClick={() => {
                  setActive(idx)
                  trackLandingCta(`hero_tab_${item.id}`)
                }}
                style={{ ['--tab-accent' as string]: item.accent }}
              >
                <span className="landing-hero-carousel-tab-dot" style={{ background: item.accent }} />
                {item.kicker}
              </button>
            ))}
          </div>

          <div className="landing-hero-carousel-footer-links">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="landing-hero-carousel-footer-link"
                onClick={(e) => {
                  trackLandingCta(`hero_quick_${item.label.toLowerCase()}`)
                  withChartGate(item.href, e as unknown as MouseEvent<HTMLElement>)
                }}
              >
                {item.label}
              </Link>
            ))}
            {showMyChart ? (
              <button
                type="button"
                className="landing-hero-carousel-footer-link"
                onClick={() => {
                  trackLandingCta('hero_quick_my_chart')
                  onOpenMyChart()
                }}
              >
                My Chart
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
