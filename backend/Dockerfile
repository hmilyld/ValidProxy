FROM python:3.13-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

COPY . .

EXPOSE 18001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "18001"]
