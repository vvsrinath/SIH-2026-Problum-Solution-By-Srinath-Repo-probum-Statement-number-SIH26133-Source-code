FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# git + build tools are required to build the `swarm` dependency from source.
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY app ./app
COPY tests ./tests

EXPOSE 8100

# The shared internal secret is injected at runtime; never bake it in.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8100"]
