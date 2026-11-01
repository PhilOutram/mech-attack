FROM python:3.12-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

COPY pyproject.toml ./
COPY tabletop_vision ./tabletop_vision
RUN pip install --no-cache-dir .

RUN useradd --create-home vision
USER vision

EXPOSE 8000
HEALTHCHECK CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"
CMD ["uvicorn", "tabletop_vision.api:app", "--host", "0.0.0.0", "--port", "8000"]
