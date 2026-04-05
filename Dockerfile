# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY EarningsPredictorApp/frontend/package*.json ./
RUN npm install
COPY EarningsPredictorApp/frontend/ ./
RUN npm run build

# Stage 2: Setup the Python backend
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY EarningsPredictorApp/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY EarningsPredictorApp/backend/ /app/backend/

# Copy built frontend from Stage 1 to the backend's dist directory
# main.py expects "dist" in its current working directory
COPY --from=frontend-builder /app/frontend/dist /app/backend/dist

# Expose the port Hugging Face Spaces expects
EXPOSE 7860

# Command to run the application
WORKDIR /app/backend
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
