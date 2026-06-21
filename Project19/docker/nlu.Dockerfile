FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir flask flask-cors jieba

COPY nlu_server.py .

EXPOSE 8002

CMD ["python", "nlu_server.py"]
