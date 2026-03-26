from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pickle
import yfinance as yf
import pandas as pd
import numpy as np
from per_quarter_features import build_live_features
import os

app = FastAPI(title="Stock Earnings Predictor API")

app.add_middleware(
    CORSMiddleware, 
    allow_origins=['*'],
    allow_methods=['*'], 
    allow_headers=['*']
)

model = None
feature_cols = None

@app.on_event("startup")
def load_model():
    global model, feature_cols
    try:
        with open('model.pkl', 'rb') as f:
            model = pickle.load(f)
        with open('feature_cols.pkl', 'rb') as f:
            feature_cols = pickle.load(f)
        print("Model and features successfully loaded at startup.")
    except Exception as e:
        print(f"Warning: Could not load model: {str(e)}")

@app.get('/predict/{ticker}')
def predict(ticker: str):
    try:
        # Pull live features — current price momentum, volatility, and historical signals
        live = build_live_features(ticker.upper())
        if live is None:
            raise ValueError(f"No earnings history data available for {ticker.upper()}. Try a major US stock.")

        print(f"\n=== {ticker.upper()} FEATURES ===")
        print(f"Revenue Growth: {live.get('revenue_growth')}")
        print(f"Historical Beat Rate: {live.get('historical_beat_rate')}")
        print(f"Last Surprise: {live.get('last_surprise_pct')}")
        print(f"Sentiment: {live.get('sentiment')}")
        print(f"========================\n")

        # ---- Weighted analytical scoring (replaces biased ML model output) ----
        # The ML model outputs 75% for everything with beat_rate_hist=1.0
        # because all S&P500 blue-chips beat every quarter — model can't differentiate.
        # This formula weights all 4 signals explicitly for genuine per-ticker variance.

        score = 0.50  # neutral starting point

        # Signal 1: Historical beat rate — strongest prior (±20% swing)
        beat_rate = live.get('beat_rate_hist', 0.5)
        score += (beat_rate - 0.5) * 0.40

        # Signal 2: Previous quarter's surprise — momentum in analyst estimates (±10%)
        prev_surprise = float(np.clip(live.get('prev_surprise_pct', 0), -0.5, 0.5))
        score += prev_surprise * 0.20

        # Signal 3: Price momentum 30d — stocks falling before earnings often miss (±8%)
        momentum = float(np.clip(live.get('price_momentum_30d', 0), -0.30, 0.30))
        score += momentum * 0.25

        # Signal 4: Volatility — high vol = more uncertainty, pull toward 50%
        volatility = live.get('volatility', 0.015)
        uncertainty = min(1.0, volatility / 0.03)
        score = score * (1 - uncertainty * 0.15) + 0.50 * (uncertainty * 0.15)

        # Final clip to honest range
        prob = float(np.clip(score, 0.25, 0.75))

        signal = 'BEAT' if prob >= 0.5 else 'MISS'

        # Fetch Next Earnings Date if available
        next_earnings = "TBD"
        try:
            stock = yf.Ticker(ticker.upper())
            cal = stock.calendar
            if cal is not None and not cal.empty:
                # yfinance calendar sometimes returns a dict or dataframe depending on the version
                if isinstance(cal, pd.DataFrame) and 'Earnings Date' in cal.index:
                    dates = cal.loc['Earnings Date']
                    if hasattr(dates, '__iter__') and len(dates) > 0:
                        next_earnings = dates[0].strftime('%b %d, %Y')
                elif isinstance(cal, dict) and 'Earnings Date' in cal:
                    dates = cal['Earnings Date']
                    if dates:
                        next_earnings = dates[0].strftime('%b %d, %Y')
        except Exception:
            pass

        # Build summary of key signals for the UI using real feature data
        from sentiment import get_sentiment
        sent_score = get_sentiment(stock)

        top_features = {
            'beat_rate_hist': live.get('beat_rate_hist', 0.5),
            'prev_surprise_pct': live.get('prev_surprise_pct', 0.0),
            'price_momentum_30d': live.get('price_momentum_30d', 0.0),
            'volatility': live.get('volatility', 0.015),
            'trailing_eps_4q': live.get('trailing_eps_4q', 0.0),
            'eps_estimate': live.get('eps_estimate', 0.0),
            # Key Signals UI Mapping
            'revenue_growth': live.get('revenue_growth', 0.0),
            'historical_beat_rate': live.get('beat_rate_hist', 0.5),
            'last_surprise_pct': live.get('prev_surprise_pct', 0.0),
            'sentiment': sent_score,
            # Legacy fields
            'gross_margins': 0.0,
            'eps_trailing': live.get('trailing_eps_4q', 0.0),
            'debt_to_equity': 0.0,
            'price_5d_change': live.get('price_momentum_30d', 0.0),
        }

        return {
            'ticker': ticker.upper(),
            'beat_probability': round(float(prob), 3),
            'signal': signal,
            'next_earnings_date': next_earnings,
            'top_features': top_features
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get('/history/{ticker}')
def history(ticker: str):
    try:
        stock = yf.Ticker(ticker.upper())
        earnings = stock.earnings_history
        if earnings is None or len(earnings) == 0:
            return []

        records = []
        for _, row in earnings.head(4).iterrows():
            raw_surprise = row.get('surprisePercent')

            # yfinance returns surprisePercent as decimal fraction
            # e.g. 0.0169 = 1.69%, multiply by 100 for display
            surprise_pct = round(float(raw_surprise) * 100, 1) if raw_surprise is not None else None

            # clamp corrupt values — when estimate is near $0
            # the percentage is mathematically meaningless
            if surprise_pct is not None and abs(surprise_pct) > 500:
                surprise_pct = None

            eps_estimate = round(float(row.get('epsEstimate', 0) or 0), 2)
            eps_actual = round(float(row.get('epsActual', 0) or 0), 2)
            eps_diff = float(row.get('epsDifference', 0) or 0)

            records.append({
                'quarter': str(row.name)[:10],
                'estimate': eps_estimate,
                'actual': eps_actual,
                'surprise': surprise_pct,
                # use epsDifference for BEAT/MISS — more reliable than surprisePercent
                # when estimate is near zero
                'result': 'BEAT' if eps_diff > 0 else 'MISS'
            })
        return records
    except Exception:
        return []

@app.get('/countdown/{ticker}')
def get_countdown(ticker: str):
    try:
        stock = yf.Ticker(ticker.upper())
        cal = stock.calendar
        
        target_date = None
        if hasattr(cal, 'empty') and not cal.empty:
            if isinstance(cal, pd.DataFrame) and 'Earnings Date' in cal.index:
                dates = cal.loc['Earnings Date']
                if hasattr(dates, '__iter__') and len(dates) > 0:
                    target_date = dates[0]
            elif isinstance(cal, dict) and 'Earnings Date' in cal:
                dates = cal['Earnings Date']
                if dates:
                    target_date = dates[0]
                    
        if target_date is not None:
            # yfinance returns timezone-aware datetimes for earnings dates usually
            now = pd.Timestamp.now(tz=target_date.tz) if hasattr(target_date, 'tz') and target_date.tz else pd.Timestamp.now()
            diff = (target_date - now).days
            if diff >= 0:
                return {"days_until": diff, "date": target_date.strftime('%b %d, %Y')}
        return None
    except Exception:
        return None

@app.get('/market')
def market_status():
    try:
        gspc = yf.Ticker('^GSPC')
        hist = gspc.history(period='2d')
        if len(hist) >= 2:
            change = (hist['Close'].iloc[-1] - hist['Close'].iloc[-2]) / hist['Close'].iloc[-2]
            return {
                'change': round(float(change), 4),
                'direction': 'up' if change >= 0 else 'down',
                'label': f"S&P 500 {'▲' if change >= 0 else '▼'} {abs(change)*100:.2f}% today"
            }
        return None
    except Exception:
        return None

@app.get('/chart/{ticker}')
def get_chart(ticker: str):
    try:
        stock = yf.Ticker(ticker.upper())
        hist = stock.history(period="3mo")
        records = []
        for date, row in hist.iterrows():
            records.append({
                "date": date.strftime('%b %d') if hasattr(date, 'strftime') else str(date),
                "close": round(row['Close'], 2)
            })
        return records
    except Exception as e:
        return []

@app.get('/signals/{ticker}')
def signals(ticker: str):
    try:
        from sentiment import get_sentiment
        stock = yf.Ticker(ticker.upper())
        info = stock.info
        hist = stock.history(period='3mo')
        earnings = stock.earnings_history

        # Revenue growth — yfinance returns decimal e.g. 0.157 = 15.7%
        raw_growth = info.get('revenueGrowth')
        revenue_growth = round(float(raw_growth) * 100, 1) if raw_growth is not None else None

        # 5-day price change — returned as percentage
        price_5d_change = None
        if hist is not None and len(hist) >= 5:
            price_5d_change = round(
                ((hist['Close'].iloc[-1] - hist['Close'].iloc[-5]) / hist['Close'].iloc[-5]) * 100, 2
            )

        # Beat rate and last surprise from earnings_history
        # surprisePercent column is a decimal fraction: 0.0169 = 1.69%
        beat_rate = None
        last_surprise = None
        if earnings is not None and len(earnings) > 0 and 'surprisePercent' in earnings.columns:
            col = earnings['surprisePercent'].dropna()
            if len(col) > 0:
                beat_rate = round((col > 0).sum() / len(col) * 100, 1)
                raw_surprise = float(col.iloc[0]) * 100  # convert fraction → %
                last_surprise = round(raw_surprise, 1) if abs(raw_surprise) < 500 else None

        # Sentiment
        sentiment_score = get_sentiment(stock)
        if sentiment_score > 0.05:
            sentiment_label = 'Positive'
        elif sentiment_score < -0.05:
            sentiment_label = 'Negative'
        else:
            sentiment_label = 'Neutral'

        return {
            'revenue_growth': revenue_growth,
            'beat_rate': beat_rate,
            'last_surprise': last_surprise,
            'price_5d_change': price_5d_change,
            'sentiment_score': round(float(sentiment_score), 3),
            'sentiment_label': sentiment_label
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get('/health')
def health():
    return {'status': 'ok'}
