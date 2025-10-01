import { createSlider, updateSlider } from './Slider';
import { createCheckbox } from './Checkbox';
import type { LowPassSettings, KalmanSettings, UKFSettings, FilterStates, FilterSettings, NoiseSettings } from '../types';

function createControlSection(title: string): { section: HTMLDivElement; content: HTMLDivElement } {
  const section = document.createElement('div');
  section.className = 'p-4 bg-gray-700/50 rounded-lg mb-6';

  const heading = document.createElement('h3');
  heading.className = 'text-lg font-semibold text-cyan-400 mb-4';
  heading.textContent = title;

  const content = document.createElement('div');
  content.className = 'space-y-4';

  section.appendChild(heading);
  section.appendChild(content);

  return { section, content };
}

export interface FilterControlsConfig {
  lowPassSettings: LowPassSettings;
  kalmanSettings: KalmanSettings;
  ukfSettings: UKFSettings;
  filterStates: FilterStates;
  noiseSettings: NoiseSettings;
  onSettingsChange: (newSettings: Partial<FilterSettings>) => void;
}

export function createFilterControls(config: FilterControlsConfig): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'h-full';

  const heading = document.createElement('h2');
  heading.className = 'text-xl font-bold mb-6 text-gray-200';
  heading.textContent = 'Filter Controls';
  container.appendChild(heading);

  // Noise Injection Section
  const noiseSection = createControlSection('Gaussian Noise Injection');
  const noiseCheckbox = createCheckbox({
    id: 'noiseEnabled',
    label: 'Enable Noise',
    checked: config.noiseSettings.enabled,
    onChange: (checked) => {
      config.onSettingsChange({ noise: { enabled: checked } });
    }
  });
  const noiseSigmaSlider = createSlider({
    id: 'noiseSigma',
    label: 'Sigma (Noise Magnitude)',
    min: 0,
    max: 50,
    step: 1,
    value: config.noiseSettings.sigma,
    disabled: !config.noiseSettings.enabled,
    onChange: (value) => {
      config.onSettingsChange({ noise: { sigma: value } });
    }
  });
  const noiseHint = document.createElement('p');
  noiseHint.className = 'text-xs text-gray-400 italic';
  noiseHint.textContent = 'Adds random Gaussian noise to mouse input before filtering.';

  noiseSection.content.appendChild(noiseCheckbox);
  noiseSection.content.appendChild(noiseSigmaSlider);
  noiseSection.content.appendChild(noiseHint);
  container.appendChild(noiseSection.section);

  // Error Graph Section
  const errorGraphSection = createControlSection('Error Metrics');
  const errorGraphCheckbox = createCheckbox({
    id: 'showErrorGraph',
    label: 'Show Error Graph',
    checked: config.filterStates.showErrorGraph,
    onChange: (checked) => {
      config.onSettingsChange({ states: { showErrorGraph: checked } });
    }
  });
  const errorGraphHint = document.createElement('p');
  errorGraphHint.className = 'text-xs text-gray-400 italic';
  errorGraphHint.textContent = 'Display rolling graph of filter errors from actual position.';

  errorGraphSection.content.appendChild(errorGraphCheckbox);
  errorGraphSection.content.appendChild(errorGraphHint);
  container.appendChild(errorGraphSection.section);

  // Low-Pass Filter Section
  const lowPassSection = createControlSection('Low-Pass Filter');
  const lowPassCheckbox = createCheckbox({
    id: 'lowPassActive',
    label: 'Enable Low-Pass Filter',
    checked: config.filterStates.isLowPassActive,
    onChange: (checked) => {
      config.onSettingsChange({ states: { isLowPassActive: checked } });
    }
  });
  const lowPassSlider = createSlider({
    id: 'alpha',
    label: 'Alpha (Smoothing Factor)',
    min: 0.01,
    max: 1,
    step: 0.01,
    value: config.lowPassSettings.alpha,
    disabled: !config.filterStates.isLowPassActive,
    onChange: (value) => {
      config.onSettingsChange({ lowPass: { alpha: value } });
    }
  });
  const lowPassHint = document.createElement('p');
  lowPassHint.className = 'text-xs text-gray-400 italic';
  lowPassHint.textContent = 'Lower alpha means more smoothing but more lag.';

  lowPassSection.content.appendChild(lowPassCheckbox);
  lowPassSection.content.appendChild(lowPassSlider);
  lowPassSection.content.appendChild(lowPassHint);
  container.appendChild(lowPassSection.section);

  // Kalman Filter Section
  const kalmanSection = createControlSection('Kalman Filter (Linear)');
  const kalmanCheckbox = createCheckbox({
    id: 'kalmanActive',
    label: 'Enable Kalman Filter',
    checked: config.filterStates.isKalmanActive,
    onChange: (checked) => {
      config.onSettingsChange({ states: { isKalmanActive: checked } });
    }
  });
  const kalmanQSlider = createSlider({
    id: 'q',
    label: 'Q (Process Noise)',
    min: 0.001,
    max: 1,
    step: 0.001,
    value: config.kalmanSettings.q,
    disabled: !config.filterStates.isKalmanActive,
    onChange: (value) => {
      config.onSettingsChange({ kalman: { q: value } });
    }
  });
  const kalmanQHint = document.createElement('p');
  kalmanQHint.className = 'text-xs text-gray-400 italic';
  kalmanQHint.textContent = 'How much we trust the prediction model. Higher Q trusts the model less.';

  const kalmanRSlider = createSlider({
    id: 'r',
    label: 'R (Measurement Noise)',
    min: 0.1,
    max: 20,
    step: 0.1,
    value: config.kalmanSettings.r,
    disabled: !config.filterStates.isKalmanActive,
    onChange: (value) => {
      config.onSettingsChange({ kalman: { r: value } });
    }
  });
  const kalmanRHint = document.createElement('p');
  kalmanRHint.className = 'text-xs text-gray-400 italic';
  kalmanRHint.textContent = 'How much we trust the raw mouse input. Higher R trusts the input less.';

  kalmanSection.content.appendChild(kalmanCheckbox);
  kalmanSection.content.appendChild(kalmanQSlider);
  kalmanSection.content.appendChild(kalmanQHint);
  kalmanSection.content.appendChild(kalmanRSlider);
  kalmanSection.content.appendChild(kalmanRHint);
  container.appendChild(kalmanSection.section);

  // UKF Section
  const ukfSection = createControlSection('Unscented Kalman Filter (Non-Linear)');
  const ukfDescription = document.createElement('p');
  ukfDescription.className = 'text-xs text-gray-400 italic mb-3';
  ukfDescription.textContent = 'Models circular motion with velocity and turn rate.';
  ukfSection.content.appendChild(ukfDescription);

  const ukfCheckbox = createCheckbox({
    id: 'ukfActive',
    label: 'Enable UKF',
    checked: config.filterStates.isUKFActive,
    onChange: (checked) => {
      config.onSettingsChange({ states: { isUKFActive: checked } });
    }
  });
  const ukfQSlider = createSlider({
    id: 'ukf_q',
    label: 'Q (Process Noise)',
    min: 0.001,
    max: 1,
    step: 0.001,
    value: config.ukfSettings.q,
    disabled: !config.filterStates.isUKFActive,
    onChange: (value) => {
      config.onSettingsChange({ ukf: { q: value } });
    }
  });
  const ukfQHint = document.createElement('p');
  ukfQHint.className = 'text-xs text-gray-400 italic';
  ukfQHint.textContent = 'Controls noise on velocity and turn rate.';

  const ukfRSlider = createSlider({
    id: 'ukf_r',
    label: 'R (Measurement Noise)',
    min: 0.1,
    max: 20,
    step: 0.1,
    value: config.ukfSettings.r,
    disabled: !config.filterStates.isUKFActive,
    onChange: (value) => {
      config.onSettingsChange({ ukf: { r: value } });
    }
  });
  const ukfRHint = document.createElement('p');
  ukfRHint.className = 'text-xs text-gray-400 italic';
  ukfRHint.textContent = 'How much we trust the raw mouse input.';

  ukfSection.content.appendChild(ukfCheckbox);
  ukfSection.content.appendChild(ukfQSlider);
  ukfSection.content.appendChild(ukfQHint);
  ukfSection.content.appendChild(ukfRSlider);
  ukfSection.content.appendChild(ukfRHint);
  container.appendChild(ukfSection.section);

  // Store references for updates
  (container as any)._noiseSigmaSlider = noiseSigmaSlider;
  (container as any)._lowPassSlider = lowPassSlider;
  (container as any)._kalmanQSlider = kalmanQSlider;
  (container as any)._kalmanRSlider = kalmanRSlider;
  (container as any)._ukfQSlider = ukfQSlider;
  (container as any)._ukfRSlider = ukfRSlider;

  return container;
}

export function updateFilterControls(container: HTMLDivElement, config: FilterControlsConfig) {
  const noiseSigmaSlider = (container as any)._noiseSigmaSlider as HTMLDivElement;
  const lowPassSlider = (container as any)._lowPassSlider as HTMLDivElement;
  const kalmanQSlider = (container as any)._kalmanQSlider as HTMLDivElement;
  const kalmanRSlider = (container as any)._kalmanRSlider as HTMLDivElement;
  const ukfQSlider = (container as any)._ukfQSlider as HTMLDivElement;
  const ukfRSlider = (container as any)._ukfRSlider as HTMLDivElement;

  updateSlider(noiseSigmaSlider, {
    value: config.noiseSettings.sigma,
    disabled: !config.noiseSettings.enabled
  });

  updateSlider(lowPassSlider, {
    value: config.lowPassSettings.alpha,
    disabled: !config.filterStates.isLowPassActive
  });

  updateSlider(kalmanQSlider, {
    value: config.kalmanSettings.q,
    disabled: !config.filterStates.isKalmanActive
  });

  updateSlider(kalmanRSlider, {
    value: config.kalmanSettings.r,
    disabled: !config.filterStates.isKalmanActive
  });

  updateSlider(ukfQSlider, {
    value: config.ukfSettings.q,
    disabled: !config.filterStates.isUKFActive
  });

  updateSlider(ukfRSlider, {
    value: config.ukfSettings.r,
    disabled: !config.filterStates.isUKFActive
  });
}
