# Startup Guide

This guide shows how to run the Earnings Predictor app locally.

## Prerequisites

- Python 3.10+ installed
- Node.js 18+ and npm installed
- Internet connection (the app fetches live market data)

## Project Structure

- `backend` - FastAPI API server
- `frontend` - Vite + React web app

## 1) Start the Backend (FastAPI)

Open a terminal:

```powershell
cd "D:\AI Project\predicting-earnings-surprises\EarningsPredictorApp\backend"
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Backend URL:

- `http://127.0.0.1:8000`

Health check:

- `http://127.0.0.1:8000/health`

## 2) Start the Frontend (Vite React)

Open a second terminal:

```powershell
cd "D:\AI Project\predicting-earnings-surprises\EarningsPredictorApp\frontend"
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Frontend URL:

- `http://127.0.0.1:5173`

## 3) Open and Test

In your browser, open:

- `http://127.0.0.1:5173`

Direct stock pages:

- `http://127.0.0.1:5173/stock/AAPL`
- `http://127.0.0.1:5173/stock/TSLA`
- `http://127.0.0.1:5173/stock/INTC`

## 4) Quick API Checks (Optional)

From any terminal:

```powershell
python -c "import requests; print(requests.get('http://127.0.0.1:8000/health').json())"
```

History endpoint sample:

```powershell
python -c "import requests; print(requests.get('http://127.0.0.1:8000/history/INTC').json())"
```

Signals endpoint sample:

```powershell
python -c "import requests; print(requests.get('http://127.0.0.1:8000/signals/AAPL').json())"
```

## Common Issues

- Port already in use:
  - Stop existing process on `8000` (backend) or `5173` (frontend), then restart.
- Backend running but frontend blank/error:
  - Confirm backend is reachable at `http://127.0.0.1:8000/health`.
- Slow/empty financial data:
  - Retry in a few seconds; market data provider calls can be delayed.

## Stop the App

In each running terminal, press `Ctrl + C`.

