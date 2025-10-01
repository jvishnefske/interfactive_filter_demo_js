import { BehaviorSubject, combineLatest, fromEvent, animationFrames } from 'rxjs';
import { map, withLatestFrom, filter } from 'rxjs';
import { createFilterControls } from './components/FilterControls';
import { createVisualizationArea, updateVisualizationArea } from './components/VisualizationArea';
import { createErrorGraph, updateErrorGraph } from './components/ErrorGraph';
import type { Coordinates, FilterSettings, FilterStates, LowPassSettings, KalmanSettings, UKFSettings, NoiseSettings } from './types';
import {
  initialKalmanFilter,
  applyKalmanFilter,
  initialLowPassFilter,
  applyLowPassFilter,
  initialUKF,
  applyUKF
} from './services/filterService';
import { addNoiseToCoordinates } from './utils/noise';

export function createApp(rootElement: HTMLElement) {
  // Create state subjects
  const isMenuOpen$ = new BehaviorSubject<boolean>(window.innerWidth >= 768);
  const mousePosition$ = new BehaviorSubject<Coordinates | null>(null);
  const filterStates$ = new BehaviorSubject<FilterStates>({
    isLowPassActive: true,
    isKalmanActive: true,
    isUKFActive: true,
    showErrorGraph: false,
  });
  const lowPassSettings$ = new BehaviorSubject<LowPassSettings>({ alpha: 0.1 });
  const kalmanSettings$ = new BehaviorSubject<KalmanSettings>({ q: 0.1, r: 4 });
  const ukfSettings$ = new BehaviorSubject<UKFSettings>({ q: 0.05, r: 4 });
  const noiseSettings$ = new BehaviorSubject<NoiseSettings>({ enabled: true, sigma: 10 });

  const filteredPositions$ = new BehaviorSubject<{
    lowPass: Coordinates | null;
    kalman: Coordinates | null;
    ukf: Coordinates | null;
  }>({
    lowPass: null,
    kalman: null,
    ukf: null,
  });

  // Filter instances
  let kalmanFilter = initialKalmanFilter(kalmanSettings$.value.q, kalmanSettings$.value.r);
  let lowPassFilter = initialLowPassFilter();
  let ukfFilter = initialUKF(ukfSettings$.value.q, ukfSettings$.value.r);

  // Reinitialize filters when settings change
  kalmanSettings$.subscribe(settings => {
    kalmanFilter = initialKalmanFilter(settings.q, settings.r);
  });

  ukfSettings$.subscribe(settings => {
    ukfFilter = initialUKF(settings.q, settings.r);
  });

  // Settings change handler
  const handleSettingsChange = (newSettings: Partial<FilterSettings>) => {
    if (newSettings.lowPass) {
      lowPassSettings$.next({ ...lowPassSettings$.value, ...newSettings.lowPass });
    }
    if (newSettings.kalman) {
      kalmanSettings$.next({ ...kalmanSettings$.value, ...newSettings.kalman });
    }
    if (newSettings.ukf) {
      ukfSettings$.next({ ...ukfSettings$.value, ...newSettings.ukf });
    }
    if (newSettings.states) {
      filterStates$.next({ ...filterStates$.value, ...newSettings.states });
    }
    if (newSettings.noise) {
      noiseSettings$.next({ ...noiseSettings$.value, ...newSettings.noise });
    }
  };

  // Build DOM structure
  const appContainer = document.createElement('div');
  appContainer.className = 'bg-gray-900 text-white min-h-screen flex flex-col font-sans';

  // Header
  const header = document.createElement('header');
  header.className = 'p-4 border-b border-gray-700 shadow-lg bg-gray-800/50 backdrop-blur-sm flex items-center gap-4 relative z-40';

  const menuButton = document.createElement('button');
  menuButton.className = 'p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white';
  menuButton.setAttribute('aria-label', 'Toggle menu');
  menuButton.innerHTML = `
    <svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  `;

  const headerContent = document.createElement('div');
  const title = document.createElement('h1');
  title.className = 'text-2xl font-bold text-cyan-400';
  title.textContent = 'Interactive Signal Filtering Demo';
  const subtitle = document.createElement('p');
  subtitle.className = 'text-gray-400';
  subtitle.textContent = 'Observe how filters estimate mouse position in real-time.';
  headerContent.appendChild(title);
  headerContent.appendChild(subtitle);

  header.appendChild(menuButton);
  header.appendChild(headerContent);
  appContainer.appendChild(header);

  // Main content area
  const mainContentArea = document.createElement('div');
  mainContentArea.className = 'flex flex-1 overflow-hidden';

  // Sidebar
  const sidebar = document.createElement('aside');
  sidebar.className = `
    fixed md:relative inset-y-0 left-0 z-30
    bg-gray-800/95 backdrop-blur-sm border-gray-700 overflow-hidden
    transform md:transform-none transition-all duration-300 ease-in-out
    translate-x-0 w-80 lg:w-96 p-6 border-r
  `;

  const sidebarInner = document.createElement('div');
  sidebarInner.className = 'h-full w-full overflow-y-auto';

  const filterControls = createFilterControls({
    lowPassSettings: lowPassSettings$.value,
    kalmanSettings: kalmanSettings$.value,
    ukfSettings: ukfSettings$.value,
    filterStates: filterStates$.value,
    noiseSettings: noiseSettings$.value,
    onSettingsChange: handleSettingsChange,
  });

  sidebarInner.appendChild(filterControls);
  sidebar.appendChild(sidebarInner);
  mainContentArea.appendChild(sidebar);

  // Overlay for mobile
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/60 z-20 md:hidden';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.display = 'none';
  mainContentArea.appendChild(overlay);

  // Main visualization area
  const main = document.createElement('main');
  main.className = 'flex-1 flex flex-col items-center justify-center p-4 overflow-hidden gap-4';

  const { container: visualizationArea, mouseMove$ } = createVisualizationArea();
  const { container: errorGraphContainer, canvas: errorGraphCanvas } = createErrorGraph();
  errorGraphContainer.style.display = 'none'; // Initially hidden

  main.appendChild(visualizationArea);
  main.appendChild(errorGraphContainer);
  mainContentArea.appendChild(main);

  appContainer.appendChild(mainContentArea);
  rootElement.appendChild(appContainer);

  // Handle menu toggle
  fromEvent(menuButton, 'click').subscribe(() => {
    isMenuOpen$.next(!isMenuOpen$.value);
  });

  fromEvent(overlay, 'click').subscribe(() => {
    isMenuOpen$.next(false);
  });

  // Update sidebar visibility based on menu state
  isMenuOpen$.subscribe(isOpen => {
    if (isOpen) {
      sidebar.className = `
        fixed md:relative inset-y-0 left-0 z-30
        bg-gray-800/95 backdrop-blur-sm border-gray-700 overflow-hidden
        transform md:transform-none transition-all duration-300 ease-in-out
        translate-x-0 w-80 lg:w-96 p-6 border-r
      `;
      overlay.style.display = window.innerWidth < 768 ? 'block' : 'none';
      menuButton.innerHTML = `
        <svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      `;
    } else {
      sidebar.className = `
        fixed md:relative inset-y-0 left-0 z-30
        bg-gray-800/95 backdrop-blur-sm border-gray-700 overflow-hidden
        transform md:transform-none transition-all duration-300 ease-in-out
        -translate-x-full md:translate-x-0 md:w-0 md:p-0 md:border-r-0
      `;
      overlay.style.display = 'none';
      menuButton.innerHTML = `
        <svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      `;
    }
  });

  // Handle mouse movement
  mouseMove$.subscribe(coords => {
    mousePosition$.next(coords);
  });

  // Filter animation loop using requestAnimationFrame via RxJS
  animationFrames().pipe(
    withLatestFrom(
      mousePosition$,
      lowPassSettings$,
      kalmanSettings$,
      ukfSettings$,
      filterStates$,
      noiseSettings$,
      filteredPositions$
    ),
    filter(([_, mousePos]) => mousePos !== null),
    map(([_, mousePos, lowPassSettings, kalmanSettings, ukfSettings, filterStates, noiseSettings, filteredPositions]) => {
      const newFilteredPositions = {
        lowPass: filteredPositions.lowPass,
        kalman: filteredPositions.kalman,
        ukf: filteredPositions.ukf,
      };

      // Apply Gaussian noise if enabled
      const noisyMousePos = (noiseSettings.enabled && mousePos)
        ? addNoiseToCoordinates(mousePos, noiseSettings.sigma)
        : mousePos;

      if (filterStates.isLowPassActive && noisyMousePos) {
        const [newCoords, newFilter] = applyLowPassFilter(lowPassFilter, noisyMousePos, lowPassSettings.alpha);
        newFilteredPositions.lowPass = newCoords;
        lowPassFilter = newFilter;
      }

      if (filterStates.isKalmanActive && noisyMousePos) {
        const [newCoords, newFilter] = applyKalmanFilter(kalmanFilter, noisyMousePos);
        newFilteredPositions.kalman = newCoords;
        kalmanFilter = newFilter;
      }

      if (filterStates.isUKFActive && noisyMousePos) {
        const [newCoords, newFilter] = applyUKF(ukfFilter, noisyMousePos);
        newFilteredPositions.ukf = newCoords;
        ukfFilter = newFilter;
      }

      return newFilteredPositions;
    })
  ).subscribe(newFilteredPositions => {
    filteredPositions$.next(newFilteredPositions);
  });

  // Update visualization area
  combineLatest([mousePosition$, filteredPositions$, filterStates$]).subscribe(
    ([mousePosition, filteredPositions, filterStates]) => {
      updateVisualizationArea(visualizationArea, {
        mousePosition,
        filteredPositions,
        filterStates,
      });

      // Update error graph
      if (filterStates.showErrorGraph) {
        errorGraphContainer.style.display = 'block';
        updateErrorGraph(errorGraphCanvas, {
          actualPosition: mousePosition,
          filteredPositions,
          filterStates,
        });
      } else {
        errorGraphContainer.style.display = 'none';
      }
    }
  );
}
