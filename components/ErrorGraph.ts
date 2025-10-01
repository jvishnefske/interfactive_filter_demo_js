import type { Coordinates } from '../types';

interface ErrorDataPoint {
  lowPass: number;
  kalman: number;
  ukf: number;
}

export interface ErrorGraphState {
  actualPosition: Coordinates | null;
  filteredPositions: {
    lowPass: Coordinates | null;
    kalman: Coordinates | null;
    ukf: Coordinates | null;
  };
  filterStates: {
    isLowPassActive: boolean;
    isKalmanActive: boolean;
    isUKFActive: boolean;
  };
}

function calculateDistance(p1: Coordinates, p2: Coordinates): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function createErrorGraph(): { container: HTMLDivElement; canvas: HTMLCanvasElement } {
  const container = document.createElement('div');
  container.className = 'w-full bg-gray-800/50 rounded-lg p-4 border border-gray-700';

  const title = document.createElement('h3');
  title.className = 'text-sm font-semibold text-gray-300 mb-2';
  title.textContent = 'Filter Error Metrics (Distance from Actual Position)';

  const canvas = document.createElement('canvas');
  canvas.className = 'w-full bg-gray-900/50 rounded';

  // Set canvas size accounting for device pixel ratio for crisp rendering
  const dpr = window.devicePixelRatio || 1;
  const logicalWidth = 800;
  const logicalHeight = 200;
  canvas.width = logicalWidth * dpr;
  canvas.height = logicalHeight * dpr;
  canvas.style.width = `${logicalWidth}px`;
  canvas.style.height = `${logicalHeight}px`;

  // Legend
  const legend = document.createElement('div');
  legend.className = 'flex gap-4 mt-2 text-xs';

  const legendItems = [
    { color: '#4ade80', label: 'Low-Pass' },
    { color: '#60a5fa', label: 'Kalman' },
    { color: '#a855f7', label: 'UKF' },
  ];

  legendItems.forEach(item => {
    const legendItem = document.createElement('div');
    legendItem.className = 'flex items-center gap-1';

    const colorBox = document.createElement('div');
    colorBox.className = 'w-3 h-3 rounded';
    colorBox.style.backgroundColor = item.color;

    const label = document.createElement('span');
    label.className = 'text-gray-400';
    label.textContent = item.label;

    legendItem.appendChild(colorBox);
    legendItem.appendChild(label);
    legend.appendChild(legendItem);
  });

  container.appendChild(title);
  container.appendChild(canvas);
  container.appendChild(legend);

  // Store error history
  (canvas as any)._errorHistory = [] as ErrorDataPoint[];
  (canvas as any)._maxHistoryLength = 200;

  return { container, canvas };
}

export function updateErrorGraph(canvas: HTMLCanvasElement, state: ErrorGraphState) {
  const errorHistory = (canvas as any)._errorHistory as ErrorDataPoint[];
  const maxHistoryLength = (canvas as any)._maxHistoryLength as number;

  // Calculate current errors
  if (state.actualPosition) {
    const errors: ErrorDataPoint = {
      lowPass: state.filterStates.isLowPassActive && state.filteredPositions.lowPass
        ? calculateDistance(state.actualPosition, state.filteredPositions.lowPass)
        : 0,
      kalman: state.filterStates.isKalmanActive && state.filteredPositions.kalman
        ? calculateDistance(state.actualPosition, state.filteredPositions.kalman)
        : 0,
      ukf: state.filterStates.isUKFActive && state.filteredPositions.ukf
        ? calculateDistance(state.actualPosition, state.filteredPositions.ukf)
        : 0,
    };

    errorHistory.push(errors);

    // Keep only the last maxHistoryLength data points
    if (errorHistory.length > maxHistoryLength) {
      errorHistory.shift();
    }
  }

  // Draw the graph
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Scale context to account for device pixel ratio
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  const padding = { top: 20, right: 20, bottom: 20, left: 50 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Clear canvas
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, width, height);

  if (errorHistory.length < 2) return;

  // Find max error for scaling
  let maxError = 0;
  errorHistory.forEach(point => {
    maxError = Math.max(maxError, point.lowPass, point.kalman, point.ukf);
  });
  maxError = Math.max(maxError, 50); // Minimum scale

  // Draw grid lines
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1;
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (graphHeight * i) / gridLines;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    // Y-axis labels
    const value = maxError * (1 - i / gridLines);
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(value.toFixed(0), padding.left - 5, y + 3);
  }

  // Draw data lines
  const drawLine = (color: string, getValue: (point: ErrorDataPoint) => number, isActive: boolean) => {
    if (!isActive) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    errorHistory.forEach((point, index) => {
      const x = padding.left + (index / (maxHistoryLength - 1)) * graphWidth;
      const value = getValue(point);
      const y = padding.top + graphHeight - (value / maxError) * graphHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  };

  drawLine('#4ade80', p => p.lowPass, state.filterStates.isLowPassActive);
  drawLine('#60a5fa', p => p.kalman, state.filterStates.isKalmanActive);
  drawLine('#a855f7', p => p.ukf, state.filterStates.isUKFActive);

  // Draw axis labels
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Time →', width / 2, height - 5);

  ctx.save();
  ctx.translate(10, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Error (pixels)', 0, 0);
  ctx.restore();
}
