FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir flask flask-cors jieba

COPY asr_server.py .

EXPOSE 8001

CMD ["python", "asr_server.py"]
