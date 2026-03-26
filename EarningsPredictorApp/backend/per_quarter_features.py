"""
per_quarter_features.py
Per-quarter feature builder for live inference.
This module is imported by both train.py and main.py to guarantee
that the feature schema is identical between training and inference.
"""
import yfinance as yf
import pandas as pd


def build_per_quarter_features(ticker_symbol):
    """
    For each historical earnings quarter, build a feature row using only
    information available at that point in time (no look-ahead bias).

    Features:
      - eps_estimate, eps_actual
      - prev_surprise_pct  (previous quarter's surprise %)
      - beat_rate_hist     (fraction of last 4 quarters that beat)
      - trailing_eps_4q    (rolling sum of last 4 actual EPS)
      - price_momentum_30d (30-day price return before earnings)
      - volatility         (std of daily returns in 60 days before earnings)

    Returns a list of dicts sorted chronologically (oldest first).
    The final dict is the most recent quarter — used for live prediction.
    """
    try:
        stock = yf.Ticker(ticker_symbol)
        eh = stock.earnings_history
        if eh is None or len(eh) < 2:
            return []

        eh = eh.sort_index()

        # 2-year price history for momentum/volatility features
        price_hist = stock.history(period="2y")
        if price_hist.empty:
            return []

        rows = []
        eh_list = list(eh.iterrows())

        for i, (date, row) in enumerate(eh_list):
            try:
                eps_est = float(row.get('epsEstimate', 0) or 0)
                eps_act = float(row.get('epsActual', 0) or 0)
                label = 1 if eps_act > eps_est else 0

                # Previous quarter surprise
                prev_surprise = 0.0
                if i > 0:
                    prev_row = eh_list[i - 1][1]
                    prev_surprise = float(prev_row.get('surprisePercent', 0) or 0)

                # Historical beat rate over last 4 quarters
                past = eh_list[max(0, i - 4):i]
                if past:
                    past_beats = sum(
                        1 for _, r in past
                        if (r.get('epsActual') or 0) > (r.get('epsEstimate') or 0)
                    )
                    beat_rate = past_beats / len(past)
                else:
                    beat_rate = 0.5

                # Trailing 4-quarter EPS
                trailing_eps = sum(
                    float(r.get('epsActual', 0) or 0)
                    for _, r in eh_list[max(0, i - 4):i]
                )

                # Price momentum: 30-day return before earnings date
                try:
                    mask = price_hist.index <= pd.Timestamp(date)
                    near_prices = price_hist.loc[mask, 'Close']
                    if len(near_prices) >= 30:
                        momentum = (near_prices.iloc[-1] - near_prices.iloc[-30]) / near_prices.iloc[-30]
                    else:
                        momentum = 0.0
                except Exception:
                    momentum = 0.0

                # Volatility: std of daily returns in 60 days before earnings
                try:
                    mask60 = price_hist.index <= pd.Timestamp(date)
                    prices60 = price_hist.loc[mask60, 'Close'].tail(60)
                    volatility = float(prices60.pct_change().dropna().std()) if len(prices60) >= 10 else 0.02
                except Exception:
                    volatility = 0.02

                rows.append({
                    'eps_estimate': eps_est,
                    'eps_actual': eps_act,
                    'prev_surprise_pct': prev_surprise,
                    'beat_rate_hist': beat_rate,
                    'trailing_eps_4q': trailing_eps,
                    'price_momentum_30d': momentum,
                    'volatility': volatility,
                    '_date': date,
                    'target': label
                })
            except Exception:
                continue

        return rows

    except Exception as e:
        print(f"  Error fetching data for {ticker_symbol}: {e}")
        return []


def build_live_features(ticker_symbol):
    """
    Build a CURRENT feature snapshot for live inference.
    Uses today's price data for momentum/volatility (not a stale historical date),
    and uses the most recent completed earnings quarter for beat_rate_hist and prev_surprise.

    This is what the /predict endpoint should use for live predictions.
    Returns a single dict of features, or None if data is unavailable.
    """
    try:
        stock = yf.Ticker(ticker_symbol)

        # ---- Earnings-based features ----
        eh = stock.earnings_history
        if eh is None or len(eh) < 1:
            return None

        eh = eh.sort_index()
        eh_list = list(eh.iterrows())

        # Most recent completed quarter
        last_idx = len(eh_list) - 1
        _, last_row = eh_list[last_idx]
        eps_est = float(last_row.get('epsEstimate', 0) or 0)
        eps_act = float(last_row.get('epsActual', 0) or 0)

        # Previous quarter surprise
        prev_surprise = 0.0
        if last_idx > 0:
            _, prev_row = eh_list[last_idx - 1]
            prev_surprise = float(prev_row.get('surprisePercent', 0) or 0)

        # Historical beat rate logic as requested by user
        if eh is not None and len(eh) > 0:
            # surprisePercent from yfinance is already a percentage e.g. 6.3 not 0.063
            # We filter for the last 4 quarters
            last_4 = eh.sort_index(ascending=False).head(4)
            beats = (last_4['surprisePercent'] > 0).sum()
            total = len(last_4)
            beat_rate = round(beats / total, 3)
            # last surprise — clamp to realistic range
            last_s = last_4['surprisePercent'].iloc[0]
            last_surprise_pct = round(float(last_s), 3) if abs(last_s) < 200 else 0.0
        else:
            beat_rate = 0.5
            last_surprise_pct = 0.0

        # Trailing 4-quarter EPS (last 4 completed)
        trailing_eps = sum(
            float(r.get('epsActual', 0) or 0)
            for _, r in eh_list[max(0, last_idx - 4):last_idx]
        )

        # ---- Current price-based features (TODAY's data) ----
        price_hist = stock.history(period="3mo")

        if len(price_hist) >= 30:
            closes = price_hist['Close']
            momentum = float((closes.iloc[-1] - closes.iloc[-30]) / closes.iloc[-30])
        else:
            momentum = 0.0

        if len(price_hist) >= 10:
            returns = price_hist['Close'].pct_change().dropna()
            volatility = float(returns.std())
        else:
            volatility = 0.02

        # Real Revenue Growth from Ticker Info
        rev_growth = float(stock.info.get('revenueGrowth', 0) or 0)

        return {
            'eps_estimate': eps_est,
            'eps_actual': eps_act,
            'prev_surprise_pct': last_surprise_pct,
            'beat_rate_hist': beat_rate,
            'trailing_eps_4q': trailing_eps,
            'price_momentum_30d': momentum,
            'volatility': volatility,
            'revenue_growth': rev_growth
        }

    except Exception as e:
        print(f"  Error building live features for {ticker_symbol}: {e}")
        return None
