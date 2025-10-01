import { fromEvent, map } from 'rxjs';

export interface CheckboxConfig {
  id: string;
  label: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
}

export function createCheckbox(config: CheckboxConfig): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'flex items-center';

  const input = document.createElement('input');
  input.id = config.id;
  input.type = 'checkbox';
  input.checked = config.checked;
  input.className = 'h-4 w-4 rounded border-gray-500 bg-gray-600 text-cyan-500 focus:ring-cyan-600 focus:ring-offset-gray-800';

  const label = document.createElement('label');
  label.htmlFor = config.id;
  label.className = 'ml-3 block text-sm font-medium text-gray-300';
  label.textContent = config.label;

  container.appendChild(input);
  container.appendChild(label);

  // Set up observable for value changes
  if (config.onChange) {
    fromEvent(input, 'change').pipe(
      map(() => input.checked)
    ).subscribe(checked => {
      config.onChange?.(checked);
    });
  }

  // Store reference for updates
  (container as any)._input = input;

  return container;
}

export function updateCheckbox(container: HTMLDivElement, config: Partial<CheckboxConfig>) {
  const input = (container as any)._input as HTMLInputElement;

  if (config.checked !== undefined) {
    input.checked = config.checked;
  }
}
