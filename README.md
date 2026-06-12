# Poke-Adocao: Pokemon Adoption System

## Project Overview
Poke-Adocao is a mobile application and backend service dedicated to the adoption of Pokemon via Geolocation. The system allows users to discover, adopt, and manage their Pokemon party based on their physical proximity to available Pokemon.

## Architecture
The system is built as a monorepo containing:
- **Backend:** A RESTful API built with Python and FastAPI. It manages user authentication, adoption logic, and spatial queries.
- **Frontend:** A cross-platform mobile application developed with React Native and Expo, utilizing Material 3 design principles via React Native Paper.
- **Database:** PostgreSQL (production) or SQLite (testing) integrated using SQLAlchemy for ORM capabilities.

## Finite State Machine
The adoption process is modeled as a Finite State Machine (FSM) with the following states:
1. **NEW:** A newly discovered Pokemon available for adoption.
2. **PENDING_MEETUP:** The user has initiated the adoption process and must meet the Pokemon at its specific location.
3. **CANCELLED:** The adoption process was aborted or the time-to-live (TTL) expired.
4. **ADOPTED:** The user has successfully completed the adoption by being physically close (<= 50 meters) to the Pokemon.

**Party Limits:** Users are strictly limited to rescuing and maintaining a maximum of 6 Pokemon in their party at any given time.

## Spatial Engine
To handle location-based discoveries and adoptions, the backend implements a spatial engine that computes distances using the Haversine formula. For optimized querying, it first calculates a Bounding Box around the user's coordinates to pre-filter potential candidates before executing the precise distance calculation.

## Setup & Usage

To set up and run the application, use the provided Makefile commands from the project root:

1. **Install Dependencies:**
	```bash
	make install
	```
	This installs Python dependencies for the backend using Poetry and Node.js dependencies for the frontend using npm.

2. **Start the Backend:**
	```bash
	make start-backend
	```
	This starts the Uvicorn server for the FastAPI application.

3. **Start the Frontend:**
	```bash
	make start-frontend
	```
	This starts the Expo development server.

4. **Run Tests:**
	```bash
	make test
	```
	Executes the pytest test suite for the backend and Jest test suite for the frontend.

5. **Clean Cache:**
	```bash
	make clean
	```
	Removes all cache files including `__pycache__`, `.pytest_cache`, `.expo`, and `node_modules`.
