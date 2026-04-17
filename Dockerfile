FROM python:3.14 AS release-env

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=1.8.2 \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    POETRY_NO_INTERACTION=1

WORKDIR /sandwichotek

RUN pip install "poetry==2.3.3"

COPY pyproject.toml poetry.lock ./

RUN poetry install --no-interaction --no-ansi --no-root

FROM python:3.14 AS release

# path needed to run uvicorn (server launcher)
ENV PATH="/sandwichotek/.venv/bin:$PATH"

COPY --from=release-env /sandwichotek/.venv /sandwichotek/.venv

RUN ln -s /bin/true /usr/local/bin/xdg-open

WORKDIR /sandwichotek/src
CMD ["python", "-m", "backend"]
