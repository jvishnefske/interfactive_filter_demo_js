
import type { Coordinates, KalmanFilterInstance, LowPassFilterInstance, UKFInstance, Matrix } from '../types';

// --- Matrix Math Utilities ---
const mat_add = (A: Matrix, B: Matrix): Matrix => A.map((row, i) => row.map((val, j) => val + B[i][j]));
const mat_sub = (A: Matrix, B: Matrix): Matrix => A.map((row, i) => row.map((val, j) => val - B[i][j]));
const mat_mul = (A: Matrix, B: Matrix): Matrix => {
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
const mat_transpose = (A: Matrix): Matrix => A[0].map((_, colIndex) => A.map(row => row[colIndex]));
const mat_scalar_mul = (A: Matrix, s: number): Matrix => A.map(row => row.map(val => val * s));

const mat_identity = (size: number): Matrix => {
    const I: Matrix = Array(size).fill(0).map(() => Array(size).fill(0));
    for (let i = 0; i < size; i++) I[i][i] = 1;
    return I;
};

// Invert a 2x2 matrix
const mat_inv_2x2 = (A: Matrix): Matrix => {
    const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
    if (det === 0) throw new Error("Matrix is singular and cannot be inverted.");
    const invDet = 1 / det;
    return [
        [A[1][1] * invDet, -A[0][1] * invDet],
        [-A[1][0] * invDet, A[0][0] * invDet]
    ];
};

// Cholesky decomposition
const mat_cholesky = (A: Matrix): Matrix => {
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


// --- Low-Pass Filter ---
export const initialLowPassFilter = (): LowPassFilterInstance => ({
    previousEstimate: null,
});

export const applyLowPassFilter = (
    filter: LowPassFilterInstance,
    measurement: Coordinates,
    alpha: number
): [Coordinates, LowPassFilterInstance] => {
    if (!filter.previousEstimate) {
        return [measurement, { previousEstimate: measurement }];
    }
    
    const newEstimate = {
        x: alpha * measurement.x + (1 - alpha) * filter.previousEstimate.x,
        y: alpha * measurement.y + (1 - alpha) * filter.previousEstimate.y,
    };

    return [newEstimate, { previousEstimate: newEstimate }];
};


// --- Kalman Filter ---
export const initialKalmanFilter = (q: number, r: number): KalmanFilterInstance => {
    return {
        x: [[0], [0], [0], [0]],
        P: mat_identity(4),
        A: [[1, 0, 1, 0], [0, 1, 0, 1], [0, 0, 1, 0], [0, 0, 0, 1]],
        H: [[1, 0, 0, 0], [0, 1, 0, 0]],
        Q: mat_scalar_mul(mat_identity(4), q),
        R: mat_scalar_mul(mat_identity(2), r),
        firstRun: true,
        lastTimestamp: null,
    };
};

export const applyKalmanFilter = (
    filter: KalmanFilterInstance,
    measurement: Coordinates
): [Coordinates, KalmanFilterInstance] => {
    let { x, P, A, H, Q, R, firstRun, lastTimestamp } = filter;

    const currentTimestamp = Date.now();
    const dt = lastTimestamp ? (currentTimestamp - lastTimestamp) / 15 : 1; // Normalize timestep
    lastTimestamp = currentTimestamp;

    A[0][2] = dt;
    A[1][3] = dt;

    if (firstRun) {
        x = [[measurement.x], [measurement.y], [0], [0]];
        firstRun = false;
    }

    const x_pred = mat_mul(A, x);
    const P_pred = mat_add(mat_mul(mat_mul(A, P), mat_transpose(A)), Q);

    const z: Matrix = [[measurement.x], [measurement.y]];
    const y = mat_sub(z, mat_mul(H, x_pred));
    const S = mat_add(mat_mul(mat_mul(H, P_pred), mat_transpose(H)), R);
    const K = mat_mul(mat_mul(P_pred, mat_transpose(H)), mat_inv_2x2(S));
    const x_new = mat_add(x_pred, mat_mul(K, y));
    const I = mat_identity(4);
    const P_new = mat_mul(mat_sub(I, mat_mul(K, H)), P_pred);

    return [{ x: x_new[0][0], y: x_new[1][0] }, { ...filter, x: x_new, P: P_new, firstRun, lastTimestamp }];
};


// --- Unscented Kalman Filter ---
export const initialUKF = (q_val: number, r_val: number): UKFInstance => {
    const n = 5; // state dimension [px, py, v, theta, omega]
    const m = 2; // measurement dimension [px, py]
    const alpha = 0.01;
    const kappa = 0;
    const beta = 2;
    const lambda = alpha * alpha * (n + kappa) - n;

    const weights_m = new Array(2 * n + 1).fill(0);
    const weights_c = new Array(2 * n + 1).fill(0);
    weights_m[0] = lambda / (n + lambda);
    weights_c[0] = lambda / (n + lambda) + (1 - alpha * alpha + beta);
    for (let i = 1; i < 2 * n + 1; i++) {
        weights_m[i] = 1 / (2 * (n + lambda));
        weights_c[i] = 1 / (2 * (n + lambda));
    }
    
    const Q = mat_identity(n);
    Q[0][0] = 0.1; Q[1][1] = 0.1; // Low noise on position
    Q[2][2] = q_val; // Noise on velocity
    Q[3][3] = 0.1;   // Low noise on heading
    Q[4][4] = q_val; // Noise on turn rate

    return {
        x: [[0], [0], [0], [0], [0]],
        P: mat_identity(n),
        Q,
        R: mat_scalar_mul(mat_identity(m), r_val),
        n, m, alpha, beta, kappa, lambda, weights_m, weights_c,
        lastTimestamp: null,
        lastMeasurement: null,
    };
};

export const applyUKF = (filter: UKFInstance, measurement: Coordinates): [Coordinates, UKFInstance] => {
    let { x, P, Q, R, n, m, lambda, weights_m, weights_c, lastTimestamp, lastMeasurement } = filter;

    const currentTimestamp = Date.now();
    const dt = lastTimestamp ? (currentTimestamp - lastTimestamp) / 15.0 : 1.0;
    
    if (!lastMeasurement) {
        x[0][0] = measurement.x;
        x[1][0] = measurement.y;
        return [{ x: x[0][0], y: x[1][0] }, { ...filter, lastTimestamp: currentTimestamp, lastMeasurement: measurement }];
    }
    
    // Initialize velocity and heading on second run
    if (lastTimestamp && x[2][0] === 0) {
        const dx = measurement.x - lastMeasurement.x;
        const dy = measurement.y - lastMeasurement.y;
        const speed = Math.sqrt(dx * dx + dy * dy) / dt;
        const heading = Math.atan2(dy, dx);
        x[2][0] = speed;
        x[3][0] = heading;
    }
    
    // 1. Generate Sigma Points
    const sigma_points = new Array(2 * n + 1).fill(0).map(() => new Array(n).fill(0).map(() => [0]));
    const P_sqrt = mat_cholesky(mat_scalar_mul(P, n + lambda));
    sigma_points[0] = x;
    for (let i = 0; i < n; i++) {
        const col = P_sqrt.map(row => [row[i]]);
        sigma_points[i + 1] = mat_add(x, col);
        sigma_points[i + 1 + n] = mat_sub(x, col);
    }
    
    // 2. Predict Step
    const sigma_points_pred = sigma_points.map(sp => {
        const [px, py, v, theta, omega] = [sp[0][0], sp[1][0], sp[2][0], sp[3][0], sp[4][0]];
        let px_p, py_p;
        if (Math.abs(omega) > 0.0001) { // Coordinated turn model
            px_p = px + (v / omega) * (Math.sin(theta + omega * dt) - Math.sin(theta));
            py_p = py + (v / omega) * (-Math.cos(theta + omega * dt) + Math.cos(theta));
        } else { // Straight line motion
            px_p = px + v * Math.cos(theta) * dt;
            py_p = py + v * Math.sin(theta) * dt;
        }
        const v_p = v;
        const theta_p = theta + omega * dt;
        const omega_p = omega;
        return [[px_p], [py_p], [v_p], [theta_p], [omega_p]];
    });

    const x_pred = new Array(n).fill(0).map(() => [0]);
    for (let i = 0; i < 2 * n + 1; i++) {
        for(let j=0; j < n; j++) x_pred[j][0] += weights_m[i] * sigma_points_pred[i][j][0];
    }
    
    let P_pred = new Array(n).fill(0).map(() => new Array(n).fill(0));
    for (let i = 0; i < 2 * n + 1; i++) {
        const diff = mat_sub(sigma_points_pred[i], x_pred);
        P_pred = mat_add(P_pred, mat_scalar_mul(mat_mul(diff, mat_transpose(diff)), weights_c[i]));
    }
    P_pred = mat_add(P_pred, Q);

    // 3. Update Step
    const z_sigma_points = sigma_points_pred.map(sp => [[sp[0][0]], [sp[1][0]]]);
    const z_pred = new Array(m).fill(0).map(() => [0]);
    for(let i=0; i<2*n+1; i++) {
        for(let j=0; j<m; j++) z_pred[j][0] += weights_m[i] * z_sigma_points[i][j][0];
    }

    let S = new Array(m).fill(0).map(() => new Array(m).fill(0));
    for(let i=0; i<2*n+1; i++) {
        const z_diff = mat_sub(z_sigma_points[i], z_pred);
        S = mat_add(S, mat_scalar_mul(mat_mul(z_diff, mat_transpose(z_diff)), weights_c[i]));
    }
    S = mat_add(S, R);

    let T = new Array(n).fill(0).map(() => new Array(m).fill(0));
    for (let i=0; i<2*n+1; i++) {
        const x_diff = mat_sub(sigma_points_pred[i], x_pred);
        const z_diff = mat_sub(z_sigma_points[i], z_pred);
        T = mat_add(T, mat_scalar_mul(mat_mul(x_diff, mat_transpose(z_diff)), weights_c[i]));
    }
    
    const K = mat_mul(T, mat_inv_2x2(S));
    const z_actual = [[measurement.x], [measurement.y]];
    const z_residual = mat_sub(z_actual, z_pred);

    const x_new = mat_add(x_pred, mat_mul(K, z_residual));
    const P_new = mat_sub(P_pred, mat_mul(mat_mul(K, S), mat_transpose(K)));

    return [
        { x: x_new[0][0], y: x_new[1][0] },
        { ...filter, x: x_new, P: P_new, lastTimestamp: currentTimestamp, lastMeasurement: measurement }
    ];
};
