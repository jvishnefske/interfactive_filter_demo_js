import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    initialLowPassFilter,
    applyLowPassFilter,
    initialKalmanFilter,
    applyKalmanFilter,
    initialUKF,
    applyUKF
} from './filterService';
import type { Coordinates } from '../types';

describe('FilterService', () => {
    describe('Low-Pass Filter', () => {
        describe('initialLowPassFilter', () => {
            it('should create filter with null previousEstimate', () => {
                const filter = initialLowPassFilter();
                expect(filter.previousEstimate).toBeNull();
            });
        });

        describe('applyLowPassFilter', () => {
            it('should return measurement on first call', () => {
                const filter = initialLowPassFilter();
                const measurement: Coordinates = { x: 100, y: 200 };
                const [result, newFilter] = applyLowPassFilter(filter, measurement, 0.5);

                expect(result).toEqual(measurement);
                expect(newFilter.previousEstimate).toEqual(measurement);
            });

            it('should apply low-pass filtering on subsequent calls', () => {
                let filter = initialLowPassFilter();
                const alpha = 0.5;

                const [, filter1] = applyLowPassFilter(filter, { x: 100, y: 100 }, alpha);
                const [result, filter2] = applyLowPassFilter(filter1, { x: 200, y: 200 }, alpha);

                // Expected: alpha * new + (1-alpha) * old = 0.5 * 200 + 0.5 * 100 = 150
                expect(result.x).toBeCloseTo(150);
                expect(result.y).toBeCloseTo(150);
            });

            it('should be more responsive with higher alpha', () => {
                const filter = initialLowPassFilter();
                const highAlpha = 0.9;
                const lowAlpha = 0.1;

                const initialMeasurement = { x: 0, y: 0 };
                const newMeasurement = { x: 100, y: 100 };

                const [, highFilter1] = applyLowPassFilter(filter, initialMeasurement, highAlpha);
                const [, lowFilter1] = applyLowPassFilter(filter, initialMeasurement, lowAlpha);

                const [highResult] = applyLowPassFilter(highFilter1, newMeasurement, highAlpha);
                const [lowResult] = applyLowPassFilter(lowFilter1, newMeasurement, lowAlpha);

                // High alpha should be closer to new measurement
                expect(highResult.x).toBeGreaterThan(lowResult.x);
                expect(highResult.y).toBeGreaterThan(lowResult.y);
            });

            it('should approach new value over multiple iterations', () => {
                let filter = initialLowPassFilter();
                const alpha = 0.3;
                const target = { x: 100, y: 100 };

                // Start at origin
                [, filter] = applyLowPassFilter(filter, { x: 0, y: 0 }, alpha);

                // Apply same target measurement multiple times
                let result: Coordinates;
                for (let i = 0; i < 20; i++) {
                    [result, filter] = applyLowPassFilter(filter, target, alpha);
                }

                // Should be very close to target after many iterations
                expect(result!.x).toBeCloseTo(100, 0);
                expect(result!.y).toBeCloseTo(100, 0);
            });

            it('should handle alpha = 1 (no filtering)', () => {
                let filter = initialLowPassFilter();
                const alpha = 1;

                [, filter] = applyLowPassFilter(filter, { x: 0, y: 0 }, alpha);
                const [result] = applyLowPassFilter(filter, { x: 100, y: 100 }, alpha);

                expect(result.x).toBe(100);
                expect(result.y).toBe(100);
            });

            it('should handle alpha = 0 (complete filtering / hold previous)', () => {
                let filter = initialLowPassFilter();
                const alpha = 0;

                [, filter] = applyLowPassFilter(filter, { x: 50, y: 50 }, alpha);
                const [result] = applyLowPassFilter(filter, { x: 100, y: 100 }, alpha);

                expect(result.x).toBe(50);
                expect(result.y).toBe(50);
            });

            it('should not mutate original filter', () => {
                const filter = initialLowPassFilter();
                const originalFilter = { ...filter };

                applyLowPassFilter(filter, { x: 100, y: 100 }, 0.5);

                expect(filter.previousEstimate).toEqual(originalFilter.previousEstimate);
            });
        });
    });

    describe('Kalman Filter', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        describe('initialKalmanFilter', () => {
            it('should create filter with correct initial state', () => {
                const filter = initialKalmanFilter(0.1, 4);

                expect(filter.firstRun).toBe(true);
                expect(filter.lastTimestamp).toBeNull();
                expect(filter.x).toHaveLength(4);
                expect(filter.P).toHaveLength(4);
                expect(filter.A).toHaveLength(4);
                expect(filter.H).toHaveLength(2);
                expect(filter.Q).toHaveLength(4);
                expect(filter.R).toHaveLength(2);
            });

            it('should set Q based on q parameter', () => {
                const q = 0.5;
                const filter = initialKalmanFilter(q, 4);

                // Q should be q * identity
                expect(filter.Q[0][0]).toBe(q);
                expect(filter.Q[1][1]).toBe(q);
                expect(filter.Q[2][2]).toBe(q);
                expect(filter.Q[3][3]).toBe(q);
            });

            it('should set R based on r parameter', () => {
                const r = 2;
                const filter = initialKalmanFilter(0.1, r);

                // R should be r * identity
                expect(filter.R[0][0]).toBe(r);
                expect(filter.R[1][1]).toBe(r);
            });
        });

        describe('applyKalmanFilter', () => {
            it('should initialize position on first measurement', () => {
                vi.setSystemTime(1000);
                const filter = initialKalmanFilter(0.1, 4);
                const measurement = { x: 100, y: 200 };

                const [result, newFilter] = applyKalmanFilter(filter, measurement);

                expect(result.x).toBeCloseTo(100);
                expect(result.y).toBeCloseTo(200);
                expect(newFilter.firstRun).toBe(false);
            });

            it('should track a stationary target', () => {
                vi.setSystemTime(0);
                let filter = initialKalmanFilter(0.1, 1);
                const target = { x: 100, y: 100 };

                let result: Coordinates;
                for (let i = 0; i < 10; i++) {
                    vi.setSystemTime(i * 16);
                    [result, filter] = applyKalmanFilter(filter, target);
                }

                expect(result!.x).toBeCloseTo(100, 0);
                expect(result!.y).toBeCloseTo(100, 0);
            });

            it('should smooth noisy measurements', () => {
                vi.setSystemTime(0);
                let filter = initialKalmanFilter(0.01, 10);

                const results: Coordinates[] = [];
                const noisyMeasurements = [
                    { x: 100, y: 100 },
                    { x: 120, y: 80 },
                    { x: 90, y: 110 },
                    { x: 110, y: 90 },
                    { x: 95, y: 105 }
                ];

                for (let i = 0; i < noisyMeasurements.length; i++) {
                    vi.setSystemTime(i * 16);
                    const [result, newFilter] = applyKalmanFilter(filter, noisyMeasurements[i]);
                    results.push(result);
                    filter = newFilter;
                }

                // Variance of filtered results should be less than input
                const inputVarianceX = noisyMeasurements.reduce((a, m) => a + (m.x - 100) ** 2, 0);
                const outputVarianceX = results.slice(1).reduce((a, m) => a + (m.x - 100) ** 2, 0);

                // Note: This is a heuristic check - filtered output should generally be smoother
                expect(outputVarianceX).toBeLessThanOrEqual(inputVarianceX);
            });

            it('should track a moving target', () => {
                vi.setSystemTime(0);
                let filter = initialKalmanFilter(0.1, 1);

                // Simulate linear motion with more data points for convergence
                const positions: Coordinates[] = [];
                for (let i = 0; i <= 20; i++) {
                    positions.push({ x: i * 2, y: i * 2 });
                }

                let result: Coordinates;
                for (let i = 0; i < positions.length; i++) {
                    vi.setSystemTime(i * 15);
                    [result, filter] = applyKalmanFilter(filter, positions[i]);
                }

                // After tracking, estimate should be close to last measurement
                // Use wider tolerance since Kalman filter smooths and may lag slightly
                expect(result!.x).toBeCloseTo(40, -1); // within 5 units
                expect(result!.y).toBeCloseTo(40, -1);
            });

            it('should not mutate original filter', () => {
                vi.setSystemTime(1000);
                const filter = initialKalmanFilter(0.1, 4);
                const originalFirstRun = filter.firstRun;
                const originalX = JSON.stringify(filter.x);

                applyKalmanFilter(filter, { x: 100, y: 100 });

                expect(filter.firstRun).toBe(originalFirstRun);
                expect(JSON.stringify(filter.x)).toBe(originalX);
            });
        });
    });

    describe('Unscented Kalman Filter', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        describe('initialUKF', () => {
            it('should create filter with correct dimensions', () => {
                const filter = initialUKF(0.1, 4);

                expect(filter.n).toBe(5); // [px, py, v, theta, omega]
                expect(filter.m).toBe(2); // [px, py]
                expect(filter.x).toHaveLength(5);
                expect(filter.P).toHaveLength(5);
                expect(filter.Q).toHaveLength(5);
                expect(filter.R).toHaveLength(2);
            });

            it('should initialize weights correctly', () => {
                const filter = initialUKF(0.1, 4);

                expect(filter.weights_m).toHaveLength(2 * filter.n + 1);
                expect(filter.weights_c).toHaveLength(2 * filter.n + 1);

                // Sum of weights_m should be 1
                const sumWeightsM = filter.weights_m.reduce((a, b) => a + b, 0);
                expect(sumWeightsM).toBeCloseTo(1);
            });

            it('should have null timestamps initially', () => {
                const filter = initialUKF(0.1, 4);

                expect(filter.lastTimestamp).toBeNull();
                expect(filter.lastMeasurement).toBeNull();
            });
        });

        describe('applyUKF', () => {
            it('should initialize position on first measurement', () => {
                vi.setSystemTime(1000);
                const filter = initialUKF(0.1, 4);
                const measurement = { x: 100, y: 200 };

                const [result, newFilter] = applyUKF(filter, measurement);

                expect(result.x).toBe(100);
                expect(result.y).toBe(200);
                expect(newFilter.lastMeasurement).toEqual(measurement);
            });

            it('should track a stationary target', () => {
                vi.setSystemTime(0);
                let filter = initialUKF(0.1, 1);
                const target = { x: 100, y: 100 };

                let result: Coordinates;
                for (let i = 0; i < 20; i++) {
                    vi.setSystemTime(i * 16);
                    [result, filter] = applyUKF(filter, target);
                }

                expect(result!.x).toBeCloseTo(100, 0);
                expect(result!.y).toBeCloseTo(100, 0);
            });

            it('should track linear motion', () => {
                vi.setSystemTime(0);
                let filter = initialUKF(0.1, 1);

                // Use more data points for convergence
                const positions: Coordinates[] = [];
                for (let i = 0; i <= 25; i++) {
                    positions.push({ x: i * 2, y: 0 });
                }

                let result: Coordinates;
                for (let i = 0; i < positions.length; i++) {
                    vi.setSystemTime(i * 15);
                    [result, filter] = applyUKF(filter, positions[i]);
                }

                // UKF may lag slightly behind true position
                expect(result!.x).toBeCloseTo(50, -1); // within 5 units
                expect(result!.y).toBeCloseTo(0, -1);
            });

            it('should track circular motion (turn model)', () => {
                vi.setSystemTime(0);
                let filter = initialUKF(0.5, 2);

                // Generate points on a circle
                const radius = 50;
                const center = { x: 100, y: 100 };
                const points: Coordinates[] = [];

                for (let i = 0; i < 16; i++) {
                    const angle = (i / 16) * 2 * Math.PI;
                    points.push({
                        x: center.x + radius * Math.cos(angle),
                        y: center.y + radius * Math.sin(angle)
                    });
                }

                let result: Coordinates;
                for (let i = 0; i < points.length; i++) {
                    vi.setSystemTime(i * 15);
                    [result, filter] = applyUKF(filter, points[i]);
                }

                // After full circle, should be back near starting point
                const distance = Math.sqrt(
                    (result!.x - points[points.length - 1].x) ** 2 +
                    (result!.y - points[points.length - 1].y) ** 2
                );
                expect(distance).toBeLessThan(30);
            });

            it('should smooth noisy circular motion', () => {
                vi.setSystemTime(0);
                let filter = initialUKF(0.1, 5);

                const radius = 50;
                const center = { x: 100, y: 100 };
                const errors: number[] = [];

                for (let i = 0; i < 20; i++) {
                    const angle = (i / 20) * 2 * Math.PI;
                    const truePos = {
                        x: center.x + radius * Math.cos(angle),
                        y: center.y + radius * Math.sin(angle)
                    };
                    // Add noise
                    const noisyPos = {
                        x: truePos.x + (Math.random() - 0.5) * 10,
                        y: truePos.y + (Math.random() - 0.5) * 10
                    };

                    vi.setSystemTime(i * 15);
                    const [result, newFilter] = applyUKF(filter, noisyPos);
                    filter = newFilter;

                    if (i > 5) {
                        // Skip first few iterations during initialization
                        const error = Math.sqrt(
                            (result.x - truePos.x) ** 2 + (result.y - truePos.y) ** 2
                        );
                        errors.push(error);
                    }
                }

                // Average error should be reasonable
                const avgError = errors.reduce((a, b) => a + b, 0) / errors.length;
                expect(avgError).toBeLessThan(20);
            });

            it('should handle velocity initialization on second measurement', () => {
                vi.setSystemTime(0);
                let filter = initialUKF(0.1, 4);

                // First measurement
                [, filter] = applyUKF(filter, { x: 0, y: 0 });

                // Second measurement at different position
                vi.setSystemTime(15);
                const [result, newFilter] = applyUKF(filter, { x: 15, y: 0 });

                // Velocity should have been initialized
                expect(newFilter.x[2][0]).toBeGreaterThan(0); // Speed > 0
            });

            it('should return new filter instance with updated state', () => {
                vi.setSystemTime(1000);
                let filter = initialUKF(0.1, 4);

                // First call initializes
                [, filter] = applyUKF(filter, { x: 100, y: 100 });

                vi.setSystemTime(1015);
                const [, newFilter] = applyUKF(filter, { x: 110, y: 100 });

                // Returned filter should have updated state
                expect(newFilter.lastTimestamp).not.toBe(filter.lastTimestamp);
                expect(newFilter.lastMeasurement).toEqual({ x: 110, y: 100 });
            });
        });
    });
});
