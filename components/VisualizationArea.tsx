import React, { useRef } from 'react';
import type { Coordinates, FilterStates } from '../types';

interface PointProps {
  position: Coordinates | null;
  color: string;
  label: string;
}

const Point: React.FC<PointProps> = ({ position, color, label }) => {
  if (!position) return null;
  
  return (
    <div
      className="absolute rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '24px',
        height: '24px',
      }}
    >
        <div 
            className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2"
            style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}`}} 
        />
        <span className="absolute top-full left-1/2 mt-2 transform -translate-x-1/2 text-xs font-semibold whitespace-nowrap" style={{color: color}}>
            {label}
        </span>
    </div>
  );
};

interface VisualizationAreaProps {
  mousePosition: Coordinates | null;
  filteredPositions: {
    lowPass: Coordinates | null;
    kalman: Coordinates | null;
    ukf: Coordinates | null;
  };
  filterStates: FilterStates;
  onMouseMove: (coords: Coordinates) => void;
}

export const VisualizationArea: React.FC<VisualizationAreaProps> = ({
  mousePosition,
  filteredPositions,
  filterStates,
  onMouseMove,
}) => {
  const areaRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (areaRef.current) {
      const rect = areaRef.current.getBoundingClientRect();
      onMouseMove({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    }
  };

  const handleTouch = (event: React.TouchEvent<HTMLDivElement>) => {
    if (areaRef.current && event.touches.length > 0) {
      const touch = event.touches[0];
      const rect = areaRef.current.getBoundingClientRect();
      onMouseMove({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      });
    }
  };

  return (
    <div className="w-full h-full bg-gray-900 border-2 border-dashed border-gray-600 rounded-lg relative overflow-hidden shadow-2xl cursor-crosshair"
      ref={areaRef}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
    >
      {!mousePosition && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none">
          Move your mouse over this area
        </div>
      )}
      <Point position={mousePosition} color="#f87171" label="Raw" />
      {filterStates.isLowPassActive && <Point position={filteredPositions.lowPass} color="#4ade80" label="Low-Pass" />}
      {filterStates.isKalmanActive && <Point position={filteredPositions.kalman} color="#60a5fa" label="Kalman" />}
      {filterStates.isUKFActive && <Point position={filteredPositions.ukf} color="#a855f7" label="UKF" />}
    </div>
  );
};