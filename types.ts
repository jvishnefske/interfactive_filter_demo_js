
export interface Coordinates {
  x: number;
  y: number;
}

export interface LowPassSettings {
  alpha: number;
}

export interface KalmanSettings {
  q: number; // Process noise
  r: number; // Measurement noise
}

export interface UKFSettings {
    q: number; // Process noise
    r: number; // Measurement noise
}

export interface NoiseSettings {
  enabled: boolean;
  sigma: number; // Standard deviation of Gaussian noise
}

export interface FilterStates {
  isLowPassActive: boolean;
  isKalmanActive: boolean;
  isUKFActive: boolean;
  showErrorGraph: boolean;
}

export interface FilterSettings {
  lowPass: LowPassSettings;
  kalman: KalmanSettings;
  ukf: UKFSettings;
  states: FilterStates;
  noise: NoiseSettings;
}

// Minimal Matrix Type
export type Matrix = number[][];

// Kalman Filter State
export interface KalmanFilterInstance {
  x: Matrix; // state vector [px, py, vx, vy]'
  P: Matrix; // covariance matrix
  A: Matrix; // state transition matrix
  H: Matrix; // measurement matrix
  Q: Matrix; // process noise covariance
  R: Matrix; // measurement noise covariance
  firstRun: boolean;
  lastTimestamp: number | null;
}

export interface LowPassFilterInstance {
    previousEstimate: Coordinates | null;
}

// UKF State
export interface UKFInstance {
    x: Matrix; // state vector [px, py, v, theta, omega]'
    P: Matrix; // covariance matrix
    Q: Matrix; // process noise covariance
    R: Matrix; // measurement noise covariance
    
    // UKF specific parameters
    n: number; // state dimension
    m: number; // measurement dimension
    alpha: number;
    beta: number;
    kappa: number;
    lambda: number;
    weights_m: number[];
    weights_c: number[];

    lastTimestamp: number | null;
    lastMeasurement: Coordinates | null;
}
