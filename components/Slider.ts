import { fromEvent, map, startWith } from 'rxjs';

export interface SliderConfig {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  disabled?: boolean;
  onChange?: (value: number) => void;
}

export function createSlider(config: SliderConfig): HTMLDivElement {
  const container = document.createElement('div');

  const labelEl = document.createElement('label');
  labelEl.htmlFor = config.id;
  labelEl.className = 'block text-sm font-medium text-gray-300 mb-1';

  const labelText = document.createTextNode(`${config.label}: `);
  labelEl.appendChild(labelText);

  const valueSpan = document.createElement('span');
  valueSpan.className = 'font-bold text-cyan-300';
  valueSpan.textContent = config.value.toFixed(3);
  labelEl.appendChild(valueSpan);

  const input = document.createElement('input');
  input.type = 'range';
  input.id = config.id;
  input.min = config.min.toString();
  input.max = config.max.toString();
  input.step = config.step.toString();
  input.value = config.value.toString();
  input.disabled = config.disabled || false;
  input.className = `w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-cyan-500
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-cyan-400 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer`;

  container.appendChild(labelEl);
  container.appendChild(input);

  // Set up observable for value changes
  if (config.onChange) {
    fromEvent(input, 'input').pipe(
      map(() => parseFloat(input.value)),
      startWith(config.value)
    ).subscribe(value => {
      valueSpan.textContent = value.toFixed(3);
      config.onChange?.(value);
    });
  }

  // Store references for updates
  (container as any)._input = input;
  (container as any)._valueSpan = valueSpan;

  return container;
}

export function updateSlider(container: HTMLDivElement, config: Partial<SliderConfig>) {
  const input = (container as any)._input as HTMLInputElement;
  const valueSpan = (container as any)._valueSpan as HTMLSpanElement;

  if (config.value !== undefined) {
    input.value = config.value.toString();
    valueSpan.textContent = config.value.toFixed(3);
  }

  if (config.disabled !== undefined) {
    input.disabled = config.disabled;
  }
}
