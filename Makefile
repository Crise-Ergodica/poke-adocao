.PHONY: install start-backend start-frontend test clean setup dev

setup: clean install

dev:
	@echo "Starting backend and frontend..."
	@cd backend && poetry run uvicorn app.main:app --reload & \
	BACKEND_PID=$$!; \
	trap "kill $$BACKEND_PID" EXIT; \
	npm run start

install:
	cd backend && poetry install
	npm install --legacy-peer-deps

start-backend:
	cd backend && poetry run uvicorn app.main:app --reload

start-frontend:
	npm run start

test:
	cd backend && poetry run pytest
	npm run test

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	rm -rf .expo
	rm -rf node_modules
