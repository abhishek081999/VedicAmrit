
import { calculateChart } from './src/lib/engine/calculator.js';

const input = {
  name: 'Test',
  birthDate: '1990-01-01',
  birthTime: '12:00:00',
  utcDate: '1990-01-01',
  utcTime: '06:30:00',
  birthPlace: 'Delhi',
  latitude: 28.6,
  longitude: 77.2,
  timezone: 'Asia/Kolkata'
};

const result = await calculateChart(input);
const sunD1 = result.grahas.find(g => g.id === 'Su');
const sunD9 = result.vargas.D9.find(g => g.id === 'Su');

console.log('Sun D1:', sunD1.rashi, sunD1.degree);
console.log('Sun D9:', sunD9.rashi, sunD9.degree);
console.log('Sun D9 total:', sunD9.totalDegree);
