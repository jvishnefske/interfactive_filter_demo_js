# Interactive Signal Filtering Demo

A real-time visualization demonstrating how signal processing filters (Low-Pass, Kalman, and Unscented Kalman) estimate and smooth mouse position data. Watch filters compete to track your cursor with minimal lag and maximum accuracy.

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:1234 in your browser
```

## Features

- **Low-Pass Filter**: Simple exponential smoothing with configurable alpha parameter
- **Kalman Filter**: Linear state estimation with position and velocity tracking
- **Unscented Kalman Filter (UKF)**: Nonlinear filter using coordinated turn motion model
- Interactive parameter tuning via sliders
- Real-time visualization of filter outputs vs raw mouse position

## Development

See the [Makefile](./Makefile) for available build targets:

```bash
make build    # Build for production
make dev      # Start development server
make lint     # Run linter
make clean    # Remove build artifacts
```

## License

MIT
