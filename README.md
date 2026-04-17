# Sandwichotek

Sandwichotek is an application designed to manage recipes of meals, set menues and generate shoping lists accordingly. 

## Dependencies

All code dependencies are managed by docker so you only need `docker` to run this project.

For my fellow Arch users (btw) you can use these packages :
- `docker`
- `docker-compose`
- `docker-buildx`

## Project Structure

The repository is organized as follows :
- **backend :** Contains the backend implemented with `SQLModel` and `FastAPI`.
- **frontend :** Contains the frontend implemented with `React`.
- **tests :** Contains the tests implemented with `pytest` for the backend.
- **docker-compose.yml :** Docker compose configuration to facilitate building and control runtime environment.
- **Dockerfile :** Docker instrcutions to build the images.
- **pyproject.toml :** Python and `Poetry` configuration for the project (only meant to be used in containers).
- **pytest.ini :** `pytest` executable config.

## Configuration
- Copy the file `.env.example` as `.env` at the root of the project. 
  - Adjust the settings as your needed.
  - Pay attention, the ports in the `.env` file are the local ports, not the container's ports.
    So even if you set `APP_PORT` to 8003 for example, `uvicorn` (the server runner) will say that the server is running on port 8000 (the container's port).

## Setup
To run the server follow these steps :
- Depending if you want to launch the server in dev mode or not, comment / uncomment the run command you want in `backend/__main__.py`.
- Run the following command to start the container :
  ```
  docker compose up --build
  ```
  Or if you don't want the logs :
  ```
  docker compose up --build -d
  ```

## Contributing

Contributions are welcomed. To contribute you can open an issue or make a pull request.

For more documentation to contribute, see the [Documentation index](docs/doc_index.md).
