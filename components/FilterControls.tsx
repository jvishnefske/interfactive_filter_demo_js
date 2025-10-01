
import React from 'react';
import type { LowPassSettings, KalmanSettings, UKFSettings, FilterStates, FilterSettings } from '../types';
import { Slider } from './Slider';
import { Checkbox } from './Checkbox';

interface FilterControlsProps {
  lowPassSettings: LowPassSettings;
  kalmanSettings: KalmanSettings;
  ukfSettings: UKFSettings;
  filterStates: FilterStates;
  onSettingsChange: (newSettings: Partial<FilterSettings>) => void;
}

const ControlSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="p-4 bg-gray-700/50 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">{title}</h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

export const FilterControls: React.FC<FilterControlsProps> = ({
  lowPassSettings,
  kalmanSettings,
  ukfSettings,
  filterStates,
  onSettingsChange,
}) => {
  return (
    <div className="h-full">
      <h2 className="text-xl font-bold mb-6 text-gray-200">Filter Controls</h2>

      <ControlSection title="Low-Pass Filter">
        <Checkbox
            id="lowPassActive"
            label="Enable Low-Pass Filter"
            checked={filterStates.isLowPassActive}
            onChange={(e) => onSettingsChange({ states: { ...filterStates, isLowPassActive: e.target.checked } })}
        />
        <Slider
          id="alpha"
          label="Alpha (Smoothing Factor)"
          min={0.01}
          max={1}
          step={0.01}
          value={lowPassSettings.alpha}
          onChange={(e) => onSettingsChange({ lowPass: { alpha: parseFloat(e.target.value) } })}
          disabled={!filterStates.isLowPassActive}
        />
        <p className="text-xs text-gray-400 italic">Lower alpha means more smoothing but more lag.</p>
      </ControlSection>

      <ControlSection title="Kalman Filter (Linear)">
        <Checkbox
            id="kalmanActive"
            label="Enable Kalman Filter"
            checked={filterStates.isKalmanActive}
            onChange={(e) => onSettingsChange({ states: { ...filterStates, isKalmanActive: e.target.checked } })}
        />
        <Slider
          id="q"
          label="Q (Process Noise)"
          min={0.001}
          max={1}
          step={0.001}
          value={kalmanSettings.q}
          onChange={(e) => onSettingsChange({ kalman: { ...kalmanSettings, q: parseFloat(e.target.value) } })}
          disabled={!filterStates.isKalmanActive}
        />
        <p className="text-xs text-gray-400 italic">How much we trust the prediction model. Higher Q trusts the model less.</p>

        <Slider
          id="r"
          label="R (Measurement Noise)"
          min={0.1}
          max={20}
          step={0.1}
          value={kalmanSettings.r}
          onChange={(e) => onSettingsChange({ kalman: { ...kalmanSettings, r: parseFloat(e.target.value) } })}
          disabled={!filterStates.isKalmanActive}
        />
        <p className="text-xs text-gray-400 italic">How much we trust the raw mouse input. Higher R trusts the input less.</p>
      </ControlSection>

      <ControlSection title="Unscented Kalman Filter (Non-Linear)">
        <Checkbox
            id="ukfActive"
            label="Enable UKF"
            checked={filterStates.isUKFActive}
            onChange={(e) => onSettingsChange({ states: { ...filterStates, isUKFActive: e.target.checked } })}
        />
        <Slider
          id="ukf_q"
          label="Q (Process Noise)"
          min={0.001}
          max={1}
          step={0.001}
          value={ukfSettings.q}
          onChange={(e) => onSettingsChange({ ukf: { ...ukfSettings, q: parseFloat(e.target.value) } })}
          disabled={!filterStates.isUKFActive}
        />
         <p className="text-xs text-gray-400 italic">Controls noise on velocity and turn rate.</p>

        <Slider
          id="ukf_r"
          label="R (Measurement Noise)"
          min={0.1}
          max={20}
          step={0.1}
          value={ukfSettings.r}
          onChange={(e) => onSettingsChange({ ukf: { ...ukfSettings, r: parseFloat(e.target.value) } })}
          disabled={!filterStates.isUKFActive}
        />
         <p className="text-xs text-gray-400 italic">How much we trust the raw mouse input.</p>
      </ControlSection>

    </div>
  );
};
