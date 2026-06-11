# Poke-Adocao

## System Architecture
The system consists of a Python backend API built with FastAPI, a PostgreSQL database, and a React Native (Expo) mobile frontend using Material 3 design principles.

- **Backend**: FastAPI is used to provide strict typing and validation. It handles user management, pokemon rescue logic, spatial queries, and external API integration.
- **Database**: PostgreSQL with PostGIS extensions to handle spatial queries efficiently (calculating proximity between users and pokemons).
- **Frontend**: React Native via Expo provides a cross-platform mobile application, styled with Material 3.

## Language and Framework Decisions
- **Python & FastAPI**: Chosen for rapid development, automatic OpenAPI documentation, and strict type checking via Pydantic, ensuring data integrity.
- **PostgreSQL**: Selected for its robust support for spatial data (PostGIS), which is essential for calculating distances between users and pokemons.
- **React Native (Expo)**: Enables single-codebase development for both iOS and Android platforms, accelerating the MVP release.
- **PokeAPI**: Used as the source of truth for pokemon data, ensuring accurate and up-to-date information.

## Spatial Calculation Algorithms
The system requires checking the proximity between a user adopting a pokemon and the user giving it up. A successful adoption requires them to be within 50 meters of each other.
- **Haversine Formula**: The backend will use the Haversine formula (or PostGIS equivalent functions like `ST_Distance`) to calculate the great-circle distance between two geographic coordinates (latitude and longitude).
- Distance threshold: `distance(user_A, user_B) <= 50.0` meters.

## API Usage
The backend API exposes endpoints for:
- User registration and authentication.
- Fetching available pokemons on the map.
- Rescuing a pokemon (max 6 per user).
- Adopting a pokemon (includes state machine logic and proximity validation).

## Project Guidelines
- Code in English.
- Docstrings in Google or reST format.
- Test Driven Development (TDD) mandatory.
- No emojis allowed.
- Real data only (no mockups), integrated with PokeAPI.
