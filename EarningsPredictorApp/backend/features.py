import yfinance as yf
import pandas as pd

def build_features(stock):
    try:
        info = stock.info
    except Exception:
        info = {}
        
    try:
        hist = stock.history(period='3mo')
    except Exception:
        hist = pd.DataFrame()
        
    try:
        earnings = stock.earnings_history
    except Exception:
        earnings = None

    features = {}

    # Financial features with robust fail-safes
    try:
        features['revenue_growth'] = info.get('revenueGrowth', 0) or 0
    except:
        features['revenue_growth'] = 0
        
    try:
        features['gross_margins']  = info.get('grossMargins', 0) or 0
    except:
        features['gross_margins'] = 0
        
    try:
        features['eps_trailing']   = info.get('trailingEps', 0) or 0
    except:
        features['eps_trailing'] = 0
        
    try:
        features['debt_to_equity'] = info.get('debtToEquity', 0) or 0
    except:
        features['debt_to_equity'] = 0

    # Price features
    try:
        if len(hist) >= 5:
            close_prices = hist['Close']
            features['price_5d_change'] = (close_prices.iloc[-1] - close_prices.iloc[-5]) / close_prices.iloc[-5]
            features['volatility'] = close_prices.pct_change().std()
        else:
            features['price_5d_change'] = 0
            features['volatility'] = 0
    except:
        features['price_5d_change'] = 0
        features['volatility'] = 0

    # Earnings history features
    try:
        if earnings is not None and not earnings.empty:
            beats = (earnings['surprisePercent'] > 0).sum()
            features['historical_beat_rate'] = beats / len(earnings)
            features['last_surprise_pct'] = earnings['surprisePercent'].iloc[-1]
        else:
            features['historical_beat_rate'] = 0.5
            features['last_surprise_pct'] = 0
    except:
        features['historical_beat_rate'] = 0.5
        features['last_surprise_pct'] = 0

    return features
