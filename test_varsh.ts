import { findSolarReturnJD, jdToDate } from './src/lib/engine/varshaphal'
import { calculateChart } from './src/lib/engine/calculator'

async function run() {
  try {
    console.log('Calculating JD...')
    const jd = findSolarReturnJD(336.73096961081177, 2028, 'lahiri')
    console.log('Found JD:', jd)

    const date = jdToDate(jd)
    console.log('Return Date:', date.toISOString())

    const settings: any = { ayanamsha: "lahiri", houseSystem: "whole_sign", nodeMode: "mean", karakaScheme: 8 }
    
    // Simulate API logic
    const year  = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day   = String(date.getUTCDate()).padStart(2, '0')
    const hour  = String(date.getUTCHours()).padStart(2, '0')
    const min   = String(date.getUTCMinutes()).padStart(2, '0')
    const sec   = String(date.getUTCSeconds()).padStart(2, '0')

    const dateStr = `${year}-${month}-${day}`
    const timeStr = `${hour}:${min}:${sec}`

    console.log('Calculating chart...', dateStr, timeStr)
    const chart = await calculateChart(
      {
        name:       `Varshaphal test`,
        birthDate:  dateStr,
        birthTime:  timeStr,
        birthPlace: "New Delhi, Delhi, IN",
        latitude:   28.6139,
        longitude:  77.209,
        timezone:   'UTC',   // return JD is in UTC
        settings:   settings,
      },
      'hora'
    )
    console.log('Success, chart generated!')
  } catch (err) {
    console.error('Test Failed:', err)
  }
}
run()
