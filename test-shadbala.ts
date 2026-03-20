
import { calculateChart } from './src/lib/engine/calculator';

async function test() {
  const input = {
    name: 'Test',
    birthDate: '1999-08-19',
    birthTime: '04:30:00', // 10:00 AM IST = 04:30 AM UTC
    birthPlace: 'Bhoranj, HP',
    latitude: 31.643,
    longitude: 76.645,
    timezone: 'Asia/Kolkata',
    settings: {
      ayanamsha: 'lahiri',
      houseSystem: 'placidus',
      karakaScheme: 7,
      nodeMode: 'mean',
      gulikaMode: 'phaladipika',
      chartStyle: 'north',
      showDegrees: true,
      showNakshatra: false,
      showKaraka: false,
      showRetro: true,
    }
  };

  const result = await calculateChart(input as any);
  if (result.shadbala) {
      console.log('SUCCESS: Shadbala found!');
      Object.keys(result.shadbala.planets).forEach(id => {
          console.log(`${id}: ${result.shadbala.planets[id].total.toFixed(2)}`);
      });
  } else {
      console.log('FAILURE: Shadbala MISSING!');
  }
}

test().catch(console.error);
