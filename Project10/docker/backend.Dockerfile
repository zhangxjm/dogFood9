FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/data/uploads

EXPOSE 5000

CMD ["gunicorn", "-b", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "run:app"]
