FROM python:3.8-alpine

ENV PYTHONFAULTHANDLER=1 \
  PYTHONUNBUFFERED=1 \
  PYTHONHASHSEED=random \
  PIP_NO_CACHE_DIR=off \
  PIP_DISABLE_PIP_VERSION_CHECK=on \
  PIP_DEFAULT_TIMEOUT=100 \
  POETRY_VERSION=1.0.5 \
  POETRY_VIRTUALENVS_CREATE=false

WORKDIR /code

COPY poetry.lock pyproject.toml weeklyingest.crontab /code/

RUN /usr/bin/crontab weeklyingest.crontab

RUN apk update && apk add --no-cache bash libpq \
  && apk add --no-cache --virtual .build-deps gcc python3-dev musl-dev postgresql-dev libffi-dev \
  && pip install --no-cache-dir "poetry==$POETRY_VERSION" \
  && poetry install --no-dev --no-interaction \
  && apk del .build-deps

COPY . /code/

CMD ["crond", "-f"]
