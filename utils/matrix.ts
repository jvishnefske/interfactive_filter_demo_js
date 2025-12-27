import type { Matrix } from '../types';

/**
 * Add two matrices element-wise
 */
export const mat_add = (A: Matrix, B: Matrix): Matrix =>
    A.map((row, i) => row.map((val, j) => val + B[i][j]));

/**
 * Subtract matrix B from matrix A element-wise
 */
export const mat_sub = (A: Matrix, B: Matrix): Matrix =>
    A.map((row, i) => row.map((val, j) => val - B[i][j]));

/**
 * Multiply two matrices
 * @throws Error if matrix dimensions are incompatible
 */
export const mat_mul = (A: Matrix, B: Matrix): Matrix => {
    if (A[0].length !== B.length) {
        throw new Error("Matrix dimensions are not compatible for multiplication.");
    }
    const C: Matrix = Array(A.length).fill(0).map(() => Array(B[0].length).fill(0));
    for (let i = 0; i < A.length; i++) {
        for (let j = 0; j < B[0].length; j++) {
            for (let k = 0; k < A[0].length; k++) {
                C[i][j] += A[i][k] * B[k][j];
            }
        }
    }
    return C;
};

/**
 * Transpose a matrix
 */
export const mat_transpose = (A: Matrix): Matrix =>
    A[0].map((_, colIndex) => A.map(row => row[colIndex]));

/**
 * Multiply a matrix by a scalar
 */
export const mat_scalar_mul = (A: Matrix, s: number): Matrix =>
    A.map(row => row.map(val => val * s));

/**
 * Create an identity matrix of given size
 */
export const mat_identity = (size: number): Matrix => {
    const I: Matrix = Array(size).fill(0).map(() => Array(size).fill(0));
    for (let i = 0; i < size; i++) I[i][i] = 1;
    return I;
};

/**
 * Invert a 2x2 matrix
 * @throws Error if matrix is singular
 */
export const mat_inv_2x2 = (A: Matrix): Matrix => {
    const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
    if (det === 0) throw new Error("Matrix is singular and cannot be inverted.");
    const invDet = 1 / det;
    return [
        [A[1][1] * invDet, -A[0][1] * invDet],
        [-A[1][0] * invDet, A[0][0] * invDet]
    ];
};

/**
 * Cholesky decomposition of a positive definite matrix
 * Returns lower triangular matrix L such that A = L * L^T
 */
export const mat_cholesky = (A: Matrix): Matrix => {
    const n = A.length;
    const L = Array(n).fill(0).map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        for (let j = 0; j <= i; j++) {
            let sum = 0;
            for (let k = 0; k < j; k++) {
                sum += L[i][k] * L[j][k];
            }
            if (i === j) {
                const val = A[i][i] - sum;
                L[i][j] = val > 0 ? Math.sqrt(val) : 0; // Handle potential floating point errors
            } else {
                if (L[j][j] === 0) continue;
                L[i][j] = (1.0 / L[j][j] * (A[i][j] - sum));
            }
        }
    }
    return L;
};
