import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FilterControls } from './components/FilterControls';
import { VisualizationArea } from './components/VisualizationArea';
import type { Coordinates, FilterSettings, FilterStates, LowPassSettings, KalmanSettings, UKFSettings } from './types';
import { initialKalmanFilter, applyKalmanFilter, initialLowPassFilter, applyLowPassFilter, initialUKF, applyUKF } from './services/filterService';

const App: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [mousePosition, setMousePosition] = useState<Coordinates | null>(null);
  const [filterStates, setFilterStates] = useState<FilterStates>({
    isLowPassActive: true,
    isKalmanActive: true,
    isUKFActive: true,
  });

  const [lowPassSettings, setLowPassSettings] = useState<LowPassSettings>({ alpha: 0.1 });
  const [kalmanSettings, setKalmanSettings] = useState<KalmanSettings>({ q: 0.1, r: 4 });
  const [ukfSettings, setUkfSettings] = useState<UKFSettings>({ q: 0.05, r: 4 });


  const [filteredPositions, setFilteredPositions] = useState<{
    lowPass: Coordinates | null;
    kalman: Coordinates | null;
    ukf: Coordinates | null;
  }>({
    lowPass: null,
    kalman: null,
    ukf: null,
  });
  
  const kalmanFilterRef = useRef(initialKalmanFilter(kalmanSettings.q, kalmanSettings.r));
  const lowPassFilterRef = useRef(initialLowPassFilter());
  const ukfFilterRef = useRef(initialUKF(ukfSettings.q, ukfSettings.r));

  // Close the menu by default on smaller screens for better initial view
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsMenuOpen(false);
    }
  }, []);

  const handleSettingsChange = useCallback((newSettings: Partial<FilterSettings>) => {
    if (newSettings.lowPass) {
      setLowPassSettings(prev => ({ ...prev, ...newSettings.lowPass }));
    }
    if (newSettings.kalman) {
      setKalmanSettings(prev => ({ ...prev, ...newSettings.kalman }));
      // Re-initialize Kalman filter when parameters change
      kalmanFilterRef.current = initialKalmanFilter(newSettings.kalman.q ?? kalmanSettings.q, newSettings.kalman.r ?? kalmanSettings.r);
    }
    if (newSettings.ukf) {
        setUkfSettings(prev => ({ ...prev, ...newSettings.ukf }));
        ukfFilterRef.current = initialUKF(newSettings.ukf.q ?? ukfSettings.q, newSettings.ukf.r ?? ukfSettings.r);
    }
    if (newSettings.states) {
        setFilterStates(prev => ({ ...prev, ...newSettings.states }));
    }
  }, [kalmanSettings.q, kalmanSettings.r, ukfSettings.q, ukfSettings.r]);

  const handleMouseMove = useCallback((coords: Coordinates) => {
    setMousePosition(coords);
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const updateFilters = () => {
      if (mousePosition) {
        const newFilteredPositions = { 
            lowPass: filteredPositions.lowPass, 
            kalman: filteredPositions.kalman,
            ukf: filteredPositions.ukf,
        };
        
        if(filterStates.isLowPassActive) {
            const [newCoords, newFilter] = applyLowPassFilter(lowPassFilterRef.current, mousePosition, lowPassSettings.alpha);
            newFilteredPositions.lowPass = newCoords;
            lowPassFilterRef.current = newFilter;
        }

        if(filterStates.isKalmanActive) {
            const [newCoords, newFilter] = applyKalmanFilter(kalmanFilterRef.current, mousePosition);
            newFilteredPositions.kalman = newCoords;
            kalmanFilterRef.current = newFilter;
        }

        if(filterStates.isUKFActive) {
            const [newCoords, newFilter] = applyUKF(ukfFilterRef.current, mousePosition);
            newFilteredPositions.ukf = newCoords;
            ukfFilterRef.current = newFilter;
        }

        setFilteredPositions(newFilteredPositions);
      }
      animationFrameId = requestAnimationFrame(updateFilters);
    };

    animationFrameId = requestAnimationFrame(updateFilters);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [mousePosition, lowPassSettings, kalmanSettings, ukfSettings, filterStates, filteredPositions.lowPass, filteredPositions.kalman, filteredPositions.ukf]);


  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col font-sans">
      <header className="p-4 border-b border-gray-700 shadow-lg bg-gray-800/50 backdrop-blur-sm flex items-center gap-4 relative z-40">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-cyan-400">Interactive Signal Filtering Demo</h1>
          <p className="text-gray-400">Observe how filters estimate mouse position in real-time.</p>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside
            className={`
              fixed md:relative inset-y-0 left-0 z-30
              bg-gray-800/95 backdrop-blur-sm border-gray-700 overflow-hidden
              transform md:transform-none transition-all duration-300 ease-in-out
              ${isMenuOpen
                  ? 'translate-x-0 w-80 lg:w-96 p-6 border-r'
                  : '-translate-x-full md:translate-x-0 md:w-0 md:p-0 md:border-r-0'
              }
            `}
        >
          {/* This inner div handles scrolling for the content */}
          <div className="h-full w-full overflow-y-auto">
            <FilterControls
              lowPassSettings={lowPassSettings}
              kalmanSettings={kalmanSettings}
              ukfSettings={ukfSettings}
              filterStates={filterStates}
              onSettingsChange={handleSettingsChange}
            />
          </div>
        </aside>

        {isMenuOpen && (
            <div 
                onClick={() => setIsMenuOpen(false)} 
                className="fixed inset-0 bg-black/60 z-20 md:hidden"
                aria-hidden="true"
            ></div>
        )}

        <main className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <VisualizationArea
            mousePosition={mousePosition}
            filteredPositions={filteredPositions}
            filterStates={filterStates}
            onMouseMove={handleMouseMove}
          />
        </main>
      </div>
    </div>
  );
};

export default App;