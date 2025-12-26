# Design Document: Interactive Signal Filtering Demo

## Overview

This application provides an interactive visualization of signal processing filters applied to mouse movement data. Users can observe how different filtering algorithms estimate and smooth noisy input signals in real-time.

## MVP Functional Requirements

### Core Features

- [x] **FR-001**: Display raw mouse position in real-time on a visualization canvas
- [x] **FR-002**: Implement Low-Pass filter with configurable alpha (smoothing factor)
- [x] **FR-003**: Implement Kalman filter with configurable process noise (Q) and measurement noise (R)
- [x] **FR-004**: Implement Unscented Kalman Filter (UKF) with configurable Q and R parameters
- [x] **FR-005**: Visualize filtered positions alongside raw mouse position
- [x] **FR-006**: Allow toggling individual filters on/off
- [x] **FR-007**: Provide slider controls for adjusting filter parameters in real-time

### User Interface

- [x] **FR-008**: Responsive layout with collapsible control panel
- [x] **FR-009**: Color-coded visualization (distinct colors for each filter output)
- [x] **FR-010**: Mobile-friendly design with touch support

### Technical Requirements

- [x] **TR-001**: Use React for component-based UI architecture
- [x] **TR-002**: Implement filters using immutable state transformations
- [x] **TR-003**: Use requestAnimationFrame for smooth rendering
- [x] **TR-004**: TypeScript for type safety

## Architecture

### Component Structure

```
App
├── FilterControls (sidebar with parameter sliders)
│   ├── Slider (reusable slider component)
│   └── Checkbox (filter toggle)
└── VisualizationArea (canvas for rendering positions)
```

### Data Flow

1. Mouse movement events captured by VisualizationArea
2. Raw coordinates passed to App component
3. Filter functions (pure) transform coordinates into filtered estimates
4. Filter state maintained in refs to preserve across renders
5. Both raw and filtered positions rendered to canvas

### Filter Implementations

#### Low-Pass Filter
- Exponential moving average
- State: previous estimate
- Parameter: alpha (0-1, higher = more responsive)

#### Kalman Filter
- Linear state-space model with position and velocity
- State: position, velocity, covariance matrix
- Parameters: Q (process noise), R (measurement noise)

#### Unscented Kalman Filter
- Nonlinear model with coordinated turn dynamics
- State: position, velocity magnitude, heading, turn rate
- Parameters: Q (process noise), R (measurement noise)
- Uses sigma point sampling for nonlinear propagation

## Traceability Matrix

| Requirement | Implementation File | Test Coverage |
|-------------|---------------------|---------------|
| FR-001 | VisualizationArea.tsx | Manual |
| FR-002 | services/filterService.ts | Pending |
| FR-003 | services/filterService.ts | Pending |
| FR-004 | services/filterService.ts | Pending |
| FR-005 | VisualizationArea.tsx | Manual |
| FR-006 | App.tsx, FilterControls.tsx | Manual |
| FR-007 | FilterControls.tsx, Slider.tsx | Manual |
| FR-008 | App.tsx (CSS) | Manual |
| FR-009 | VisualizationArea.tsx | Manual |
| FR-010 | App.tsx (responsive CSS) | Manual |
