import type { Coordinates } from '../types';

/**
 * Box-Muller transform to generate Gaussian (normally distributed) random numbers
 * Returns a pair of independent standard normal random variables
 */
function boxMuller(): [number, number] {
  let u1 = 0, u2 = 0;
  // Ensure u1 and u2 are not 0
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();

  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);

  return [z0, z1];
}

/**
 * Generates Gaussian noise with mean 0 and specified standard deviation
 */
export function gaussianNoise(sigma: number): number {
  const [z0] = boxMuller();
  return z0 * sigma;
}

/**
 * Adds Gaussian noise to coordinates
 */
export function addNoiseToCoordinates(coords: Coordinates, sigma: number): Coordinates {
  const [noiseX, noiseY] = boxMuller();

  return {
    x: coords.x + noiseX * sigma,
    y: coords.y + noiseY * sigma,
  };
}
