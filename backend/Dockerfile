FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    binutils libproj-dev gdal-bin libgdal-dev libgeos-dev \
    postgresql-client build-essential \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

CMD gunicorn mjengosmart.wsgi:application --bind 0.0.0.0:$PORT