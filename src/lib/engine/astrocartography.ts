// ─────────────────────────────────────────────────────────────
//  src/lib/engine/astrocartography.ts
//  NASA-Level ACG Engine: Aspects, Transits, and Parans
// ─────────────────────────────────────────────────────────────

import sweph from 'sweph'
import { getPlanetPosition, PLANET_IDS } from './ephemeris'
import type { GrahaId } from '@/types/astrology'
import path from 'path'

const C = sweph.constants

const ephePath = process.env.EPHE_PATH
  ? path.resolve(process.env.EPHE_PATH)
  : path.join(process.cwd(), 'ephe')

sweph.set_ephe_path(ephePath)

export interface ACGParan { p1: GrahaId; p2: GrahaId; lat: number; lon: number; type: string; }
export interface ACGAspectLine { type: 'Trine' | 'Square'; lon: number; }

export interface ACGLines {
  grahaId: GrahaId
  mcLine: number
  icLine: number
  aspects: ACGAspectLine[]
  asCurve: [number, number][][]
  dsCurve: [number, number][][] 
  zenith: [number, number]
  localSpaceBearing: number
}

export interface ACGResult {
  lines: ACGLines[]
  parans: ACGParan[]
  currentDashaLord?: GrahaId
}

function norm(lon: number) {
    return ((lon + 180) % 360 + 360) % 360 - 180
}

export function calculateACG(jd: number, birthLat?: number, birthLng?: number): ACGResult {
  const gstHours = sweph.sidtime(jd)
  const gstDeg = gstHours * 15

  const lines: ACGLines[] = []
  const TARGETS: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra']
  const planetaryData: any = {}

  for (const rid of TARGETS) {
    try {
      const sweId = (PLANET_IDS as any)[rid]
      const pos = getPlanetPosition(jd, sweId, false, true)
      planetaryData[rid] = { ra: pos.longitude, dec: pos.latitude }
      
      const ra = pos.longitude; const dec = pos.latitude
      const mcLon = norm(ra - gstDeg)
      const icLon = norm(mcLon + 180)

      // Calculate Aspects (Trines & Squares to MC)
      const listAspects: ACGAspectLine[] = [
        { type: 'Trine',  lon: norm(mcLon + 120) },
        { type: 'Trine',  lon: norm(mcLon - 120) },
        { type: 'Square', lon: norm(mcLon + 90) },
        { type: 'Square', lon: norm(mcLon - 90) }
      ]

      const asSegments: [number, number][][] = [[]]
      const dsSegments: [number, number][][] = [[]]
      const rad = Math.PI / 180; const tanDec = Math.tan(dec * rad)

      for (let lat = -75; lat <= 75; lat += 2) {
        const phi = lat * rad; const tanPhi = Math.tan(phi)
        const cosHA = -(tanPhi * tanDec)
        
        if (Math.abs(cosHA) <= 1) {
          const ha = Math.acos(cosHA) / rad
          const asLon = norm(ra - gstDeg - ha)
          let lastAS = asSegments[asSegments.length - 1]
          if (lastAS.length > 0 && Math.abs(asLon - lastAS[lastAS.length-1][1]) > 180) {
              asSegments.push([]); lastAS = asSegments[asSegments.length - 1]
          }
          lastAS.push([lat, asLon])

          const dsLon = norm(ra - gstDeg + ha)
          let lastDS = dsSegments[dsSegments.length - 1]
          if (lastDS.length > 0 && Math.abs(dsLon - lastDS[lastDS.length-1][1]) > 180) {
              dsSegments.push([]); lastDS = dsSegments[dsSegments.length - 1]
          }
          lastDS.push([lat, dsLon])
        }
      }

      let bearing = 0
      if (birthLat !== undefined && birthLng !== undefined) {
        try {
          const xin: [number, number, number] = [ra, dec, 1.0]; const geopos: [number, number, number] = [birthLng, birthLat, 0]
          const res = sweph.azalt(jd, C.SE_EQU2HOR, geopos, 0, 0, xin) as any
          if (res && res.data) bearing = res.data[0]
        } catch (e) {}
      }

      lines.push({
        grahaId: rid, mcLine: mcLon, icLine: icLon, aspects: listAspects,
        asCurve: asSegments.filter(s => s.length > 0), dsCurve: dsSegments.filter(s => s.length > 0),
        zenith: [dec, mcLon], localSpaceBearing: bearing
      })
    } catch (err) {}
  }

  const parans: ACGParan[] = []
  const rad = Math.PI / 180
  for (const p1 of lines) {
    for (const p2 of lines) {
        if (p1.grahaId === p2.grahaId) continue
        const dec2 = planetaryData[p2.grahaId].dec; const ra2 = planetaryData[p2.grahaId].ra
        const tanDec2 = Math.tan(dec2 * rad)
        const haNeededAS = norm(ra2 - gstDeg - p1.mcLine)
        const haNeededDS = norm(p1.mcLine - (ra2 - gstDeg))

        const findLat = (ha: number, label: string) => {
            const cosHA = Math.cos(ha * rad); const tanPhi = -(cosHA / Math.tan(dec2 * rad))
            const phi = Math.atan(tanPhi) / rad
            if (phi >= -75 && phi <= 75) {
                if (!parans.some(pa => pa.p1 === p1.grahaId && pa.p2 === p2.grahaId && Math.abs(pa.lat - phi) < 1)) {
                    parans.push({ p1: p1.grahaId, p2: p2.grahaId, lat: phi, lon: p1.mcLine, type: `MC / ${label}` })
                }
            }
        }
        findLat(haNeededAS, "AS"); findLat(haNeededDS, "DS")
    }
  }

  let currentDashaLord: GrahaId | undefined = undefined
  try {
    const moonPos = getPlanetPosition(jd, (PLANET_IDS as any).Mo, false, true)
    const birthDate = new Date((jd - 2440587.5) * 86400000)
    const { calcVimshottari, getCurrentDasha } = require('./dasha/vimshottari')
    const dashaTree = calcVimshottari(moonPos.longitude, birthDate, 1)
    const current = getCurrentDasha(dashaTree)
    if (current.length > 0) currentDashaLord = current[0].lord as GrahaId
  } catch (e) {}

  return { lines, parans, currentDashaLord }
}
