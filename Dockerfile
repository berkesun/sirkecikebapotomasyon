# Sirkeci Kebap Portal — konteyner imajı (Railway, Fly.io, Render, VPS)
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .
COPY static ./static
# Veritabanı kalıcı diske yazılır: Railway/Fly volume'unu /data yoluna bağlayın (Dockerfile VOLUME komutu Railway'de desteklenmez).
ENV SIRKECI_DB=/data/sirkeci.db
EXPOSE 8000
CMD ["sh", "-c", "python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]
