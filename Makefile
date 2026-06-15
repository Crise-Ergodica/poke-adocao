.PHONY: install start-backend start-frontend test clean setup dev help

## Show this help message
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: clean install ## Prepare development environment: clean cache and install dependencies

install: ## Install backend (poetry) and frontend (npm) dependencies
	cd backend && poetry install
	npm install --legacy-peer-deps

start-backend: ## Start the FastAPI backend server
	cd backend && poetry run uvicorn app.main:app --reload

start-frontend: ## Start the Expo frontend
	npm run start

dev: ## Start backend and frontend concurrently with process management
	@echo "Starting backend and frontend..."
	@cd backend && poetry run uvicorn app.main:app --reload & \
	BACKEND_PID=$$!; \
	trap "kill $$BACKEND_PID" EXIT INT TERM; \
	npm run start

test: ## Run backend (pytest) and frontend (jest) tests
	cd backend && poetry run pytest
	npm run test

clean: ## Remove all cache, build artifacts, and node_modules
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	rm -rf .expo
	rm -rf node_modules