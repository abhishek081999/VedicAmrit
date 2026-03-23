import { calculateVimsopaka } from '../src/lib/engine/vimsopaka'
import { GrahaData, VargaChart, Relationships } from '../src/types/astrology'

const mockGrahas: Partial<GrahaData>[] = [
  { id: 'Su', lonSidereal: 10, rashi: 1 }, // Sun in Aries (Exalted)
  { id: 'Mo', lonSidereal: 40, rashi: 2 }, // Moon in Taurus (Exalted)
  { id: 'Ma', lonSidereal: 280, rashi: 10 }, // Mars in Capricorn (Exalted)
  { id: 'Me', lonSidereal: 165, rashi: 6 }, // Mercury in Virgo (Exalted)
  { id: 'Ju', lonSidereal: 95, rashi: 4 }, // Jupiter in Cancer (Exalted)
  { id: 'Ve', lonSidereal: 345, rashi: 12 }, // Venus in Pisces (Exalted)
  { id: 'Sa', lonSidereal: 195, rashi: 7 }, // Saturn in Libra (Exalted)
  { id: 'Ra', lonSidereal: 50, rashi: 2 },
  { id: 'Ke', lonSidereal: 230, rashi: 8 },
]

const mockVargas: Record<string, VargaChart> = {}
const vargaNames = ['D1', 'D2', 'D3', 'D7', 'D9', 'D10', 'D12', 'D16', 'D20', 'D24', 'D27', 'D30', 'D40', 'D45', 'D60']
vargaNames.forEach(v => {
  mockVargas[v] = {
    varga: v,
    planets: mockGrahas as GrahaData[]
  }
})

const mockRelationships: Relationships = {
  natural: {},
  temporal: {},
  combined: {}
}

const ids = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
ids.forEach(p1 => {
  mockRelationships.combined[p1] = {}
  ids.forEach(p2 => {
    mockRelationships.combined[p1][p2] = 'Friend'
  })
})

const result = calculateVimsopaka(mockGrahas as GrahaData[], mockVargas, mockRelationships)
console.log('Vimsopaka Calculation Result:')
console.log(JSON.stringify(result, null, 2))

const shodashaSu = result.shodashavarga.Su
console.log(`Sun Shodashavarga Score: ${shodashaSu}`)
if (shodashaSu > 15) {
  console.log('SUCCESS: Calculation seems to work (Expected > 15 for exalted Sun in all vargas)')
} else {
  console.log('FAILURE: Score too low for exalted Sun')
  process.exit(1)
}
