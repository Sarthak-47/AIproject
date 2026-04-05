# Earnings Surprise Predictor

A full-stack financial intelligence application that forecasts whether a publicly traded company will **beat or miss** its quarterly earnings expectations — before the announcement. Built with React, FastAPI, and a weighted analytical scoring system informed by XGBoost/Random Forest research.

---

## What Is This Project?

Every quarter, publicly traded companies report their **Earnings Per Share (EPS)**. Analysts publish their **EPS estimates** in advance, and the market reacts dramatically to the gap between expectation and reality:

- **Positive Surprise** → Actual EPS significantly exceeds estimate → Stock rallies
- **Negative Surprise** → Actual EPS significantly misses estimate → Stock drops

This project predicts which outcome is more likely *before* the announcement, outputting a **Beat Probability (%)** and a directional signal (`BEAT` or `MISS`). A surprise is considered "significant" at a **±15% deviation** from analyst estimates.

---

## System Architecture

```
┌──────────────────────────────────────────────────────┐
│                  USER (Browser)                      │
└─────────────────────┬────────────────────────────────┘
                      │ Ticker Input
                      ▼
┌──────────────────────────────────────────────────────┐
│             FRONTEND — React + Vite                  │
│  Pages: Home, StockDetail, Compare, Search,          │
│         Performance                                  │
│  Components: GaugeMeter, PredictionCard,             │
│              KeySignals, FeatureBar, SignalBadge      │
│  Deployed on: Vercel                                 │
└─────────────────────┬────────────────────────────────┘
                      │ REST API Calls
                      ▼
┌──────────────────────────────────────────────────────┐
│             BACKEND — FastAPI (Python)               │
│  Endpoints:                                          │
│    GET /predict/{ticker}   → Main prediction         │
│    GET /history/{ticker}   → EPS history             │
│    GET /signals/{ticker}   → Signal breakdown        │
│    GET /chart/{ticker}     → 3-month price chart     │
│    GET /countdown/{ticker} → Next earnings date      │
│    GET /market             → S&P 500 market status   │
│  Deployed on: Render                                 │
└──────┬──────────────────────────────┬────────────────┘
       │                              │
       ▼                              ▼
┌─────────────────┐        ┌──────────────────────────┐
│  yfinance API   │        │   Feature Engine          │
│  (Yahoo Finance)│        │   per_quarter_features.py │
│  - Price data   │        │   sentiment.py            │
│  - EPS history  │        │   features.py             │
│  - News feed    │        └──────────────────────────┘
│  - Calendar     │
└─────────────────┘
```

---

## End-to-End Workflow

### Step 1 — User Enters a Ticker
The user lands on the Home page and searches for a stock (e.g., `AAPL`). The frontend provides autocomplete from a built-in list of 30 major S&P 500 tickers and also tracks recently viewed tickers via `localStorage`.

### Step 2 — Frontend Fires API Requests
Once a ticker is selected, `StockDetail.jsx` concurrently fires multiple requests to the FastAPI backend:
- `/predict/{ticker}` — to get the beat probability and signal
- `/history/{ticker}` — to get the last 4 quarters of EPS history
- `/chart/{ticker}` — to get 3-month price history for charting
- `/countdown/{ticker}` — to display days until next earnings
- `/signals/{ticker}` — to get granular signal breakdown

### Step 3 — Backend Fetches Live Data
The FastAPI backend receives the ticker and triggers `yfinance` to fetch:
- **Earnings history** — past EPS estimates, actuals, and surprise percentages
- **Price history** — last 3 months of OHLCV data
- **Company info** — revenue growth, sector metadata
- **News feed** — latest 5 headlines for sentiment analysis
- **Calendar** — next scheduled earnings date

### Step 4 — Feature Engineering
`per_quarter_features.py` → `build_live_features(ticker)` computes a snapshot of 8 key signals using only data available *today* (no look-ahead bias):

| Feature | Description |
|---|---|
| `beat_rate_hist` | Fraction of last 4 quarters where actual EPS > estimated EPS |
| `prev_surprise_pct` | Surprise percentage from the most recent completed quarter |
| `price_momentum_30d` | 30-day price return leading up to today |
| `volatility` | Standard deviation of daily returns over the last 60 trading days |
| `eps_estimate` | Analyst consensus EPS for the upcoming quarter |
| `trailing_eps_4q` | Rolling sum of actual EPS over the last 4 quarters |
| `revenue_growth` | Year-over-year revenue growth rate from Yahoo Finance info |
| `sentiment` | NLP polarity score derived from recent news headlines |

### Step 5 — Scoring Engine Calculates Beat Probability
The production backend uses a **Weighted Analytical Scoring System** (not the raw ML model output) derived from insights gained during the research/training phase:

```
score = 0.50  (neutral starting point)

score += (beat_rate_hist - 0.5) × 0.40      # Historical Beat Rate  — 40% weight
score += prev_surprise_pct × 0.20            # Surprise Momentum     — 20% weight
score += price_momentum_30d × 0.25           # Price Momentum        — 25% weight

# Volatility dampener — pulls toward 50% under high uncertainty
uncertainty = min(1.0, volatility / 0.03)
score = score × (1 - uncertainty × 0.15) + 0.50 × (uncertainty × 0.15)

beat_probability = clip(score, 0.25, 0.75)   # honest range — avoids overconfidence
signal = "BEAT" if beat_probability ≥ 0.50 else "MISS"
```

> **Why not use the ML model directly?** The trained XGBoost/Random Forest classifier became biased toward large-cap S&P 500 stocks (which beat almost every quarter by a thin margin), assigning them all a flat ~75% probability. The weighted scoring system provides genuine per-ticker variance by explicitly weighting all four signals.

### Step 6 — Sentiment Analysis (NLP)
`sentiment.py` uses **TextBlob** to analyze the polarity of the 5 most recent news headlines fetched via `yfinance`. It returns a score from -1.0 (very negative) to +1.0 (very positive), mapped to `Positive / Neutral / Negative` labels in the UI.

```python
titles = ' '.join([n.get('title', '') for n in stock.news[:5]])
score = TextBlob(titles).sentiment.polarity
```

### Step 7 — Frontend Renders the Dashboard
The React frontend displays results across multiple components:

- **`GaugeMeter`** — Animated arc gauge showing beat probability (25–75%)
- **`PredictionCard`** — Main card with signal badge (`BEAT`/`MISS`), probability, next earnings date, and countdown
- **`KeySignals`** — Four signal cards: Revenue Growth, Historical Beat Rate, Last Surprise %, Sentiment
- **`FeatureBar`** — Horizontal bar visualization of feature importance
- **`SignalBadge`** — Color-coded BEAT/MISS/NEUTRAL badge
- **Price Chart** — 3-month price history line chart (Recharts)
- **EPS History Chart** — Bar chart comparing actual vs. estimated EPS for last 4 quarters

---

## The ML Research Phase (Training)

The production scoring system was informed by an ML research phase using `train.py`:

- **Data**: Historical earnings data for 30 major U.S. tickers, pulled quarter-by-quarter via `yfinance`
- **Model**: `XGBClassifier` wrapped with `CalibratedClassifierCV` for well-calibrated probability outputs
- **Training split**: Chronological (older quarters train, recent quarters test) to prevent future leakage
- **Features used**: All 8 features listed in Step 4, built per-quarter with no look-ahead bias
- **Key finding**: `beat_rate_hist` and `prev_surprise_pct` were the strongest predictors; price momentum and volatility added meaningful signal

The trained model artifacts (`model.pkl`, `feature_cols.pkl`) are preserved in the backend directory but the production `/predict` endpoint uses the weighted scoring formula above for more interpretable and stable per-ticker results.

---

## Project Structure

```
AIproject-main/
├── EarningsPredictorApp/
│   ├── backend/
│   │   ├── main.py                  # FastAPI app, all endpoints
│   │   ├── per_quarter_features.py  # Feature engineering (historical + live)
│   │   ├── features.py              # Supplementary feature helpers
│   │   ├── sentiment.py             # NLP sentiment via TextBlob
│   │   ├── train.py                 # ML model training script (research)
│   │   ├── model.pkl                # Trained XGBoost model (serialized)
│   │   ├── feature_cols.pkl         # Feature column schema (serialized)
│   │   └── requirements.txt         # Backend Python dependencies
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── Home.jsx         # Landing page with ticker search
│   │   │   │   ├── StockDetail.jsx  # Main prediction dashboard
│   │   │   │   ├── Compare.jsx      # Side-by-side stock comparison
│   │   │   │   ├── Search.jsx       # Search results page
│   │   │   │   └── Performance.jsx  # Historical performance view
│   │   │   └── components/
│   │   │       ├── GaugeMeter.jsx   # Beat probability arc gauge
│   │   │       ├── PredictionCard.jsx
│   │   │       ├── KeySignals.jsx
│   │   │       ├── FeatureBar.jsx
│   │   │       ├── SignalBadge.jsx
│   │   │       └── LoadingState.jsx
│   │   ├── package.json
│   │   └── vite.config.js
│   ├── render.yaml                  # Render deployment config (backend)
│   └── .env.example
├── scripts/
│   └── backfillter.py               # Historical data backfill utility
├── requirements.txt                 # Research-phase dependencies
├── system_architecture.txt          # Architecture reference
└── PROJECT_EXPLANATION.md           # Detailed project narrative
```

---

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- pip, npm

### Backend Setup

```bash
cd EarningsPredictorApp/backend
pip install fastapi uvicorn yfinance pandas numpy scikit-learn xgboost textblob joblib
python -m uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. You can explore all endpoints at `http://localhost:8000/docs` (Swagger UI).

### Frontend Setup

```bash
cd EarningsPredictorApp/frontend
npm install
```

Create a `.env` file (copy from `.env.example`) and set:
```
VITE_API_URL=http://localhost:8000
```

Then run:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### (Optional) Re-train the Model

```bash
cd EarningsPredictorApp/backend
python train.py
```

This will fetch data for 30 tickers via `yfinance`, build per-quarter features, train an XGBoost classifier, and save `model.pkl` and `feature_cols.pkl`.

---

## Tech Stack

| Category | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts, Lucide React, Axios |
| **Backend** | Python, FastAPI, Uvicorn |
| **Data** | yfinance (Yahoo Finance), Pandas, NumPy |
| **ML / NLP** | XGBoost, Scikit-learn, TextBlob |
| **Deployment** | Vercel (frontend), Render (backend) |
| **Serialization** | Pickle (model artifacts) |

---

## Limitations & Disclaimer

- Predictions are based on **historical patterns and quantitative signals only** — they do not incorporate insider information, macro events, or management guidance.
- The model is calibrated on **large-cap S&P 500 stocks**; accuracy degrades for small/mid-cap or thinly traded equities.
- Beat probability is clipped to **[0.25, 0.75]** intentionally — the model does not claim near-certainty.
- **This is not financial advice.** Use this tool for research and educational purposes only.

---

## Author

Built by **Sarthak** as a financial ML research project, combining quantitative finance concepts with production-grade full-stack engineering.
