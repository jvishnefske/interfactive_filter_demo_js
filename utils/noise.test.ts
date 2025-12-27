import { describe, it, expect, vi } from 'vitest';
import { gaussianNoise, addNoiseToCoordinates } from './noise';

describe('Noise Utilities', () => {
    describe('gaussianNoise', () => {
        it('should return a number', () => {
            const result = gaussianNoise(1);
            expect(typeof result).toBe('number');
        });

        it('should return 0 when sigma is 0', () => {
            const result = gaussianNoise(0);
            expect(result).toBeCloseTo(0);
        });

        it('should produce values within expected range for sigma=1 (statistical test)', () => {
            // For a standard normal distribution, ~99.7% of values fall within 3 sigma
            const samples: number[] = [];
            for (let i = 0; i < 1000; i++) {
                samples.push(gaussianNoise(1));
            }

            const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
            const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;
            const stdDev = Math.sqrt(variance);

            // Mean should be close to 0 (within reasonable tolerance for 1000 samples)
            expect(Math.abs(mean)).toBeLessThan(0.2);
            // Standard deviation should be close to 1
            expect(stdDev).toBeGreaterThan(0.7);
            expect(stdDev).toBeLessThan(1.3);
        });

        it('should scale with sigma parameter', () => {
            const samples1: number[] = [];
            const samples10: number[] = [];
            for (let i = 0; i < 500; i++) {
                samples1.push(gaussianNoise(1));
                samples10.push(gaussianNoise(10));
            }

            const variance1 = samples1.reduce((a, b) => a + b ** 2, 0) / samples1.length;
            const variance10 = samples10.reduce((a, b) => a + b ** 2, 0) / samples10.length;

            // Variance of sigma=10 should be roughly 100x variance of sigma=1
            const ratio = variance10 / variance1;
            expect(ratio).toBeGreaterThan(50);
            expect(ratio).toBeLessThan(200);
        });
    });

    describe('addNoiseToCoordinates', () => {
        it('should return coordinates object with x and y', () => {
            const coords = { x: 100, y: 200 };
            const result = addNoiseToCoordinates(coords, 10);
            expect(result).toHaveProperty('x');
            expect(result).toHaveProperty('y');
            expect(typeof result.x).toBe('number');
            expect(typeof result.y).toBe('number');
        });

        it('should return original coordinates when sigma is 0', () => {
            const coords = { x: 100, y: 200 };
            const result = addNoiseToCoordinates(coords, 0);
            expect(result.x).toBe(100);
            expect(result.y).toBe(200);
        });

        it('should add noise that is statistically centered around original', () => {
            const coords = { x: 100, y: 200 };
            const sigma = 10;
            let sumDx = 0;
            let sumDy = 0;
            const n = 500;

            for (let i = 0; i < n; i++) {
                const result = addNoiseToCoordinates(coords, sigma);
                sumDx += result.x - coords.x;
                sumDy += result.y - coords.y;
            }

            const meanDx = sumDx / n;
            const meanDy = sumDy / n;

            // Mean displacement should be close to 0
            expect(Math.abs(meanDx)).toBeLessThan(3);
            expect(Math.abs(meanDy)).toBeLessThan(3);
        });

        it('should produce independent noise for x and y', () => {
            const coords = { x: 0, y: 0 };
            const samples: Array<{ x: number; y: number }> = [];

            for (let i = 0; i < 500; i++) {
                samples.push(addNoiseToCoordinates(coords, 1));
            }

            // Calculate correlation coefficient
            const meanX = samples.reduce((a, b) => a + b.x, 0) / samples.length;
            const meanY = samples.reduce((a, b) => a + b.y, 0) / samples.length;

            let covXY = 0;
            let varX = 0;
            let varY = 0;

            for (const s of samples) {
                covXY += (s.x - meanX) * (s.y - meanY);
                varX += (s.x - meanX) ** 2;
                varY += (s.y - meanY) ** 2;
            }

            const correlation = covXY / Math.sqrt(varX * varY);

            // X and Y should be nearly uncorrelated (correlation close to 0)
            expect(Math.abs(correlation)).toBeLessThan(0.2);
        });

        it('should handle negative coordinates', () => {
            const coords = { x: -50, y: -100 };
            const result = addNoiseToCoordinates(coords, 5);
            // Should still return numbers centered around the original
            expect(typeof result.x).toBe('number');
            expect(typeof result.y).toBe('number');
        });
    });
});
