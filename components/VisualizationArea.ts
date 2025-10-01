import { fromEvent, merge, map, Observable } from 'rxjs';
import type { Coordinates, FilterStates } from '../types';

interface PointConfig {
  position: Coordinates | null;
  color: string;
  label: string;
  labelPosition: 'bottom' | 'right' | 'left' | 'top';
}

function getLabelClasses(position: 'bottom' | 'right' | 'left' | 'top'): string {
  const baseClasses = 'absolute text-xs font-semibold whitespace-nowrap';
  switch (position) {
    case 'bottom':
      return `${baseClasses} top-full left-1/2 mt-2 transform -translate-x-1/2`;
    case 'top':
      return `${baseClasses} bottom-full left-1/2 mb-2 transform -translate-x-1/2`;
    case 'right':
      return `${baseClasses} left-full top-1/2 ml-2 transform -translate-y-1/2`;
    case 'left':
      return `${baseClasses} right-full top-1/2 mr-2 transform -translate-y-1/2`;
  }
}

function createPoint(config: PointConfig): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'absolute rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2';
  container.style.width = '24px';
  container.style.height = '24px';

  if (config.position) {
    container.style.left = `${config.position.x}px`;
    container.style.top = `${config.position.y}px`;

    const dot = document.createElement('div');
    dot.className = 'absolute top-1/2 left-1/2 w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2';
    dot.style.backgroundColor = config.color;
    dot.style.boxShadow = `0 0 12px ${config.color}`;

    const labelSpan = document.createElement('span');
    labelSpan.className = getLabelClasses(config.labelPosition);
    labelSpan.style.color = config.color;
    labelSpan.textContent = config.label;

    container.appendChild(dot);
    container.appendChild(labelSpan);
  } else {
    container.style.display = 'none';
  }

  return container;
}

function updatePoint(container: HTMLDivElement, config: PointConfig) {
  if (config.position) {
    // Create children if they don't exist
    if (container.children.length === 0) {
      const dot = document.createElement('div');
      dot.className = 'absolute top-1/2 left-1/2 w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2';
      dot.style.backgroundColor = config.color;
      dot.style.boxShadow = `0 0 12px ${config.color}`;

      const labelSpan = document.createElement('span');
      labelSpan.className = getLabelClasses(config.labelPosition);
      labelSpan.style.color = config.color;
      labelSpan.textContent = config.label;

      container.appendChild(dot);
      container.appendChild(labelSpan);
    }

    container.style.display = 'block';
    container.style.left = `${config.position.x}px`;
    container.style.top = `${config.position.y}px`;
  } else {
    container.style.display = 'none';
  }
}

export interface VisualizationAreaState {
  mousePosition: Coordinates | null;
  filteredPositions: {
    lowPass: Coordinates | null;
    kalman: Coordinates | null;
    ukf: Coordinates | null;
  };
  filterStates: FilterStates;
}

export function createVisualizationArea(): { container: HTMLDivElement; mouseMove$: Observable<Coordinates> } {
  const container = document.createElement('div');
  container.className = 'w-full h-full bg-gray-900 border-2 border-dashed border-gray-600 rounded-lg relative overflow-hidden shadow-2xl cursor-crosshair';

  const hint = document.createElement('div');
  hint.className = 'absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none';
  hint.textContent = 'Move your mouse over this area';
  container.appendChild(hint);

  const rawPoint = createPoint({ position: null, color: '#f87171', label: 'Raw', labelPosition: 'bottom' });
  const lowPassPoint = createPoint({ position: null, color: '#4ade80', label: 'Low-Pass', labelPosition: 'right' });
  const kalmanPoint = createPoint({ position: null, color: '#60a5fa', label: 'Kalman', labelPosition: 'left' });
  const ukfPoint = createPoint({ position: null, color: '#a855f7', label: 'UKF', labelPosition: 'top' });

  container.appendChild(rawPoint);
  container.appendChild(lowPassPoint);
  container.appendChild(kalmanPoint);
  container.appendChild(ukfPoint);

  // Store references
  (container as any)._hint = hint;
  (container as any)._rawPoint = rawPoint;
  (container as any)._lowPassPoint = lowPassPoint;
  (container as any)._kalmanPoint = kalmanPoint;
  (container as any)._ukfPoint = ukfPoint;

  // Create mouse move observable
  const mouseMove$ = fromEvent<MouseEvent>(container, 'mousemove').pipe(
    map(event => {
      const rect = container.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    })
  );

  const touchMove$ = fromEvent<TouchEvent>(container, 'touchmove').pipe(
    map(event => {
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        const rect = container.getBoundingClientRect();
        return {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        };
      }
      return null;
    }),
    map(pos => pos!)
  );

  const touchStart$ = fromEvent<TouchEvent>(container, 'touchstart').pipe(
    map(event => {
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        const rect = container.getBoundingClientRect();
        return {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        };
      }
      return null;
    }),
    map(pos => pos!)
  );

  const allMoveEvents$ = merge(mouseMove$, touchMove$, touchStart$);

  return { container, mouseMove$: allMoveEvents$ };
}

export function updateVisualizationArea(container: HTMLDivElement, state: VisualizationAreaState) {
  const hint = (container as any)._hint as HTMLDivElement;
  const rawPoint = (container as any)._rawPoint as HTMLDivElement;
  const lowPassPoint = (container as any)._lowPassPoint as HTMLDivElement;
  const kalmanPoint = (container as any)._kalmanPoint as HTMLDivElement;
  const ukfPoint = (container as any)._ukfPoint as HTMLDivElement;

  if (state.mousePosition) {
    hint.style.display = 'none';
  } else {
    hint.style.display = 'flex';
  }

  updatePoint(rawPoint, { position: state.mousePosition, color: '#f87171', label: 'Raw', labelPosition: 'bottom' });

  if (state.filterStates.isLowPassActive) {
    updatePoint(lowPassPoint, { position: state.filteredPositions.lowPass, color: '#4ade80', label: 'Low-Pass', labelPosition: 'right' });
  } else {
    lowPassPoint.style.display = 'none';
  }

  if (state.filterStates.isKalmanActive) {
    updatePoint(kalmanPoint, { position: state.filteredPositions.kalman, color: '#60a5fa', label: 'Kalman', labelPosition: 'left' });
  } else {
    kalmanPoint.style.display = 'none';
  }

  if (state.filterStates.isUKFActive) {
    updatePoint(ukfPoint, { position: state.filteredPositions.ukf, color: '#a855f7', label: 'UKF', labelPosition: 'top' });
  } else {
    ukfPoint.style.display = 'none';
  }
}
