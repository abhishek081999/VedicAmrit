/** Prefill lines for festival/eclipse card from Panchang tithi name (user-editable). */
export function suggestFestivalFromTithi(tithiName: string): { title: string; subtitle: string } {
  const t = tithiName.trim()
  const lower = t.toLowerCase()
  if (lower.includes('ekadashi')) {
    return { title: 'Ekadashi', subtitle: `${t} — fasting & Vishnu remembrance` }
  }
  if (lower.includes('purnima') || lower.includes('pūrṇimā')) {
    return { title: 'Purnima', subtitle: `${t} — full Moon observances` }
  }
  if (lower.includes('amavasya') || lower.includes('amāvasyā')) {
    return { title: 'Amavasya', subtitle: `${t} — pitṛ & inner reset` }
  }
  if (lower.includes('sashti') || lower.includes('ṣaṣṭhī')) {
    return { title: 'Sashti', subtitle: `${t} — Skanda / wellness focus` }
  }
  if (lower.includes('chaturthi') || lower.includes('caturthī')) {
    return { title: 'Chaturthi', subtitle: `${t} — Ganapati day` }
  }
  return { title: 'Vaidika observance', subtitle: t }
}
