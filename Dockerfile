FROM python:3.14 AS graphviz-bin

RUN apt-get update
RUN apt-get -y install graphviz

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

COPY --from=graphviz-bin /usr/bin/dot /usr/bin/dot
COPY --from=graphviz-bin /usr/lib/x86_64-linux-gnu/ /usr/lib/x86_64-linux-gnu/
COPY --from=release-env /sandwichotek/.venv /sandwichotek/.venv

RUN ln -s /bin/true /usr/local/bin/xdg-open

WORKDIR /sandwichotek/src
CMD ["python", "-m", "backend"]
