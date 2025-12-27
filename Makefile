.PHONY: all build dev test coverage lint clean install

# Default target
all: install lint build

# Install dependencies
install:
	npm install

# Build for production
build:
	npm run build

# Start development server
dev:
	npm run dev

# Run tests (Vitest)
test:
	npm test

# Run tests with coverage
coverage:
	npm run test:coverage

# Run linter
lint:
	npx tsc --noEmit

# Clean build artifacts
clean:
	rm -rf dist .parcel-cache node_modules/.cache coverage

# Format code (if prettier is available)
format:
	npx prettier --write "**/*.{ts,tsx,js,jsx,json,css,md}" || true

# Type check
typecheck:
	npx tsc --noEmit

# Full CI pipeline
ci: install lint test build
