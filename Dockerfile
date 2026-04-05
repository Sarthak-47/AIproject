# --- Stage 1: Build Frontend ---
FROM node:18-slim AS frontend-build
WORKDIR /app/frontend
COPY EarningsPredictorApp/frontend/package*.json ./
RUN npm install
COPY EarningsPredictorApp/frontend/ ./
RUN npm run build

# --- Stage 2: Final Image ---
FROM python:3.10-slim

# Set working directory to backend folder as home
WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY EarningsPredictorApp/backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY EarningsPredictorApp/backend/ ./

# Copy built frontend assets from stage 1 into backend/dist
COPY --from=frontend-build /app/frontend/dist ./dist

# Create a non-root user (Hugging Face recommendation)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Expose the standard Hugging Face port
EXPOSE 7860

# Run uvicorn on port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
