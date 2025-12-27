import { describe, it, expect } from 'vitest';
import {
    mat_add,
    mat_sub,
    mat_mul,
    mat_transpose,
    mat_scalar_mul,
    mat_identity,
    mat_inv_2x2,
    mat_cholesky
} from './matrix';

describe('Matrix Utilities', () => {
    describe('mat_add', () => {
        it('should add two 2x2 matrices correctly', () => {
            const A = [[1, 2], [3, 4]];
            const B = [[5, 6], [7, 8]];
            const result = mat_add(A, B);
            expect(result).toEqual([[6, 8], [10, 12]]);
        });

        it('should add matrices with negative numbers', () => {
            const A = [[1, -2], [-3, 4]];
            const B = [[-1, 2], [3, -4]];
            const result = mat_add(A, B);
            expect(result).toEqual([[0, 0], [0, 0]]);
        });

        it('should add 3x3 matrices', () => {
            const A = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
            const B = [[9, 8, 7], [6, 5, 4], [3, 2, 1]];
            const result = mat_add(A, B);
            expect(result).toEqual([[10, 10, 10], [10, 10, 10], [10, 10, 10]]);
        });
    });

    describe('mat_sub', () => {
        it('should subtract two 2x2 matrices correctly', () => {
            const A = [[5, 6], [7, 8]];
            const B = [[1, 2], [3, 4]];
            const result = mat_sub(A, B);
            expect(result).toEqual([[4, 4], [4, 4]]);
        });

        it('should handle subtraction resulting in zeros', () => {
            const A = [[1, 2], [3, 4]];
            const result = mat_sub(A, A);
            expect(result).toEqual([[0, 0], [0, 0]]);
        });
    });

    describe('mat_mul', () => {
        it('should multiply two 2x2 matrices correctly', () => {
            const A = [[1, 2], [3, 4]];
            const B = [[5, 6], [7, 8]];
            const result = mat_mul(A, B);
            expect(result).toEqual([[19, 22], [43, 50]]);
        });

        it('should multiply identity matrix without changing the original', () => {
            const A = [[1, 2], [3, 4]];
            const I = [[1, 0], [0, 1]];
            const result = mat_mul(A, I);
            expect(result).toEqual(A);
        });

        it('should multiply a 2x3 by a 3x2 matrix', () => {
            const A = [[1, 2, 3], [4, 5, 6]];
            const B = [[7, 8], [9, 10], [11, 12]];
            const result = mat_mul(A, B);
            expect(result).toEqual([[58, 64], [139, 154]]);
        });

        it('should throw error for incompatible dimensions', () => {
            const A = [[1, 2], [3, 4]];
            const B = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
            expect(() => mat_mul(A, B)).toThrow('Matrix dimensions are not compatible for multiplication.');
        });

        it('should multiply column vector by row vector', () => {
            const col = [[1], [2], [3]];
            const row = [[4, 5, 6]];
            const result = mat_mul(col, row);
            expect(result).toEqual([[4, 5, 6], [8, 10, 12], [12, 15, 18]]);
        });
    });

    describe('mat_transpose', () => {
        it('should transpose a 2x2 matrix', () => {
            const A = [[1, 2], [3, 4]];
            const result = mat_transpose(A);
            expect(result).toEqual([[1, 3], [2, 4]]);
        });

        it('should transpose a 2x3 matrix to 3x2', () => {
            const A = [[1, 2, 3], [4, 5, 6]];
            const result = mat_transpose(A);
            expect(result).toEqual([[1, 4], [2, 5], [3, 6]]);
        });

        it('should return same matrix when transposed twice', () => {
            const A = [[1, 2], [3, 4]];
            const result = mat_transpose(mat_transpose(A));
            expect(result).toEqual(A);
        });
    });

    describe('mat_scalar_mul', () => {
        it('should multiply all elements by scalar', () => {
            const A = [[1, 2], [3, 4]];
            const result = mat_scalar_mul(A, 2);
            expect(result).toEqual([[2, 4], [6, 8]]);
        });

        it('should handle scalar of zero', () => {
            const A = [[1, 2], [3, 4]];
            const result = mat_scalar_mul(A, 0);
            expect(result).toEqual([[0, 0], [0, 0]]);
        });

        it('should handle negative scalar', () => {
            const A = [[1, 2], [3, 4]];
            const result = mat_scalar_mul(A, -1);
            expect(result).toEqual([[-1, -2], [-3, -4]]);
        });

        it('should handle fractional scalar', () => {
            const A = [[2, 4], [6, 8]];
            const result = mat_scalar_mul(A, 0.5);
            expect(result).toEqual([[1, 2], [3, 4]]);
        });
    });

    describe('mat_identity', () => {
        it('should create 2x2 identity matrix', () => {
            const result = mat_identity(2);
            expect(result).toEqual([[1, 0], [0, 1]]);
        });

        it('should create 3x3 identity matrix', () => {
            const result = mat_identity(3);
            expect(result).toEqual([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
        });

        it('should create 4x4 identity matrix', () => {
            const result = mat_identity(4);
            expect(result).toEqual([
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1]
            ]);
        });

        it('should create 1x1 identity matrix', () => {
            const result = mat_identity(1);
            expect(result).toEqual([[1]]);
        });
    });

    describe('mat_inv_2x2', () => {
        it('should invert a 2x2 matrix correctly', () => {
            const A = [[4, 7], [2, 6]];
            const result = mat_inv_2x2(A);
            // det = 4*6 - 7*2 = 24 - 14 = 10
            expect(result[0][0]).toBeCloseTo(0.6);
            expect(result[0][1]).toBeCloseTo(-0.7);
            expect(result[1][0]).toBeCloseTo(-0.2);
            expect(result[1][1]).toBeCloseTo(0.4);
        });

        it('should satisfy A * A_inv = I', () => {
            const A = [[4, 7], [2, 6]];
            const A_inv = mat_inv_2x2(A);
            const result = mat_mul(A, A_inv);
            expect(result[0][0]).toBeCloseTo(1);
            expect(result[0][1]).toBeCloseTo(0);
            expect(result[1][0]).toBeCloseTo(0);
            expect(result[1][1]).toBeCloseTo(1);
        });

        it('should throw error for singular matrix', () => {
            const A = [[1, 2], [2, 4]]; // det = 0
            expect(() => mat_inv_2x2(A)).toThrow('Matrix is singular and cannot be inverted.');
        });

        it('should invert identity matrix to itself', () => {
            const I = [[1, 0], [0, 1]];
            const result = mat_inv_2x2(I);
            // Use toBeCloseTo for floating point comparisons (handles -0 vs 0)
            expect(result[0][0]).toBeCloseTo(1);
            expect(result[0][1]).toBeCloseTo(0);
            expect(result[1][0]).toBeCloseTo(0);
            expect(result[1][1]).toBeCloseTo(1);
        });
    });

    describe('mat_cholesky', () => {
        it('should decompose a 2x2 positive definite matrix', () => {
            const A = [[4, 2], [2, 5]];
            const L = mat_cholesky(A);
            // L * L^T should equal A
            const reconstructed = mat_mul(L, mat_transpose(L));
            expect(reconstructed[0][0]).toBeCloseTo(A[0][0]);
            expect(reconstructed[0][1]).toBeCloseTo(A[0][1]);
            expect(reconstructed[1][0]).toBeCloseTo(A[1][0]);
            expect(reconstructed[1][1]).toBeCloseTo(A[1][1]);
        });

        it('should produce a lower triangular matrix', () => {
            const A = [[4, 2], [2, 5]];
            const L = mat_cholesky(A);
            // Upper triangle (excluding diagonal) should be zeros
            expect(L[0][1]).toBe(0);
        });

        it('should decompose identity matrix to itself', () => {
            const I = [[1, 0], [0, 1]];
            const L = mat_cholesky(I);
            expect(L).toEqual([[1, 0], [0, 1]]);
        });

        it('should decompose a 3x3 positive definite matrix', () => {
            const A = [[4, 2, 1], [2, 5, 3], [1, 3, 6]];
            const L = mat_cholesky(A);
            const reconstructed = mat_mul(L, mat_transpose(L));
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    expect(reconstructed[i][j]).toBeCloseTo(A[i][j], 10);
                }
            }
        });
    });
});
