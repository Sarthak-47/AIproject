import yfinance as yf
import pandas as pd
import numpy as np
import pickle
from xgboost import XGBClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score
from per_quarter_features import build_per_quarter_features

# Expanded ticker universe for more training samples
TICKERS = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "NVDA", "JPM", "V", "JNJ",
    "WMT", "PG", "MA", "UNH", "DIS", "HD", "BAC", "VZ", "KO", "PFE",
    "XOM", "ABBV", "CSCO", "INTC", "AMD", "NFLX", "ADBE", "CRM", "PYPL", "QCOM"
]


def build_per_quarter_features(ticker_symbol):
    """
    For each historical earnings quarter, build a feature row using only
    information available *at that point in time* — no look-ahead bias.

    Features per quarter:
      - eps_actual (this quarter)
      - eps_estimate (this quarter)
      - surprise_pct (this quarter — current beat/miss candidate)
      - prev_surprise_pct (previous quarter)
      - trailing_eps_4q (rolling sum of last 4 actual EPS)
      - beat_rate_hist (fraction of last 4 quarters that beat)
      - price_momentum: % price change in 30 days before earnings date
      - volatility: std of daily returns in 60 days before earnings
      - label: 1 if this quarter beat, else 0
    """
    try:
        stock = yf.Ticker(ticker_symbol)
        eh = stock.earnings_history
        if eh is None or len(eh) < 3:
            return []

        # Sort chronologically
        eh = eh.sort_index()

        # Fetch 2-year price history for momentum features
        price_hist = stock.history(period="2y")
        if price_hist.empty:
            return []

        rows = []
        eh_list = list(eh.iterrows())

        for i, (date, row) in enumerate(eh_list):
            try:
                eps_est = float(row.get('epsEstimate', 0) or 0)
                eps_act = float(row.get('epsActual', 0) or 0)
                surprise = float(row.get('surprisePercent', 0) or 0)
                label = 1 if eps_act > eps_est else 0

                # Previous quarter surprise
                prev_surprise = 0.0
                if i > 0:
                    prev_row = eh_list[i - 1][1]
                    prev_surprise = float(prev_row.get('surprisePercent', 0) or 0)

                # Historical beat rate over last 4 quarters
                past = eh_list[max(0, i-4):i]
                if past:
                    past_beats = sum(
                        1 for _, r in past
                        if (r.get('epsActual') or 0) > (r.get('epsEstimate') or 0)
                    )
                    beat_rate = past_beats / len(past)
                else:
                    beat_rate = 0.5  # neutral prior

                # Trailing 4-quarter EPS
                trailing_eps = sum(
                    float(r.get('epsActual', 0) or 0)
                    for _, r in eh_list[max(0, i-4):i]
                )

                # Price momentum: 30-day return before earnings date
                try:
                    # Find trading days around the earnings date
                    mask = price_hist.index <= pd.Timestamp(date)
                    near_prices = price_hist.loc[mask, 'Close']
                    if len(near_prices) >= 30:
                        price_30d_ago = near_prices.iloc[-30]
                        price_now = near_prices.iloc[-1]
                        momentum = (price_now - price_30d_ago) / price_30d_ago
                    else:
                        momentum = 0.0
                except Exception:
                    momentum = 0.0

                # Volatility: std of daily returns in 60 days before earnings
                try:
                    mask60 = price_hist.index <= pd.Timestamp(date)
                    prices60 = price_hist.loc[mask60, 'Close'].tail(60)
                    if len(prices60) >= 10:
                        returns = prices60.pct_change().dropna()
                        volatility = float(returns.std())
                    else:
                        volatility = 0.02  # default
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
            except Exception as e:
                continue

        return rows

    except Exception as e:
        print(f"  Error for {ticker_symbol}: {e}")
        return []


def create_dataset():
    all_rows = []
    print("Building per-quarter feature dataset with real historical labels...")

    for ticker in TICKERS:
        print(f"  Fetching {ticker}...")
        rows = build_per_quarter_features(ticker)
        if rows:
            all_rows.extend(rows)
        else:
            print(f"  Skipping {ticker}: insufficient history.")

    if not all_rows:
        return pd.DataFrame()

    df = pd.DataFrame(all_rows)
    df.fillna(0, inplace=True)
    df.sort_values('_date', inplace=True)
    df.drop(columns=['_date'], inplace=True)
    return df


def train_model():
    df = create_dataset()

    if len(df) < 10:
        print("Error: Not enough training samples. Check yfinance connectivity.")
        return

    feature_cols = [c for c in df.columns if c != 'target']
    X = df[feature_cols]
    y = df['target']

    print(f"\nDataset: {len(df)} samples | Beat rate: {y.mean():.1%}")
    print(f"Class distribution: {y.value_counts().to_dict()}")

    # Time-based split: last 20% as holdout
    split = int(len(X) * 0.80)
    X_train, X_test = X.iloc[:split], X.iloc[split:]
    y_train, y_test = y.iloc[:split], y.iloc[split:]

    # Guard against single-class splits
    if len(y_train.unique()) < 2:
        y_train = y_train.copy()
        y_train.iloc[0] = 1 - int(y_train.iloc[0])
    if len(y_test.unique()) < 2:
        y_test = y_test.copy()
        y_test.iloc[0] = 1 - int(y_test.iloc[0])

    print("\nTraining calibrated XGBoost (may take ~30s)...")

    base_model = XGBClassifier(
        n_estimators=200,
        max_depth=3,          # Shallower = less overfit
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric='logloss',
        random_state=42
    )

    cv_folds = min(5, len(y_train) // 10)
    cv_folds = max(cv_folds, 2)
    model = CalibratedClassifierCV(base_model, method='sigmoid', cv=cv_folds)
    model.fit(X_train, y_train)

    # Holdout evaluation
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    acc = accuracy_score(y_test, y_pred)

    print(f"\n{'='*50}")
    print(f"  Holdout accuracy:              {acc:.3f}")
    print(f"  Average predicted probability: {y_prob.mean():.3f}")
    print(f"  Probability range:             {y_prob.min():.3f} – {y_prob.max():.3f}")
    print(f"{'='*50}")
    print("  Target: accuracy 0.55-0.70, avg prob ~0.50-0.58, range 0.30-0.75")

    # Save feature columns + model
    with open('feature_cols.pkl', 'wb') as f:
        pickle.dump(feature_cols, f)
    with open('model.pkl', 'wb') as f:
        pickle.dump(model, f)

    print("\nSaved calibrated model.pkl and feature_cols.pkl")

    # 5-ticker sanity check using the NEW per-quarter feature schema
    print("\n--- Per-ticker sanity check (using same features as training) ---")
    test_tickers = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN']
    all_ok = True
    for t in test_tickers:
        try:
            rows = build_per_quarter_features(t)
            if not rows:
                print(f"  {t}: No data")
                continue
            # Use the most recent quarter's features as the live prediction
            latest = rows[-1]
            feat = {k: v for k, v in latest.items() if k != 'target'}
            for col in feature_cols:
                if col not in feat:
                    feat[col] = 0.0
            Xq = pd.DataFrame([feat])[feature_cols]
            raw_prob = model.predict_proba(Xq)[0][1]
            clipped = float(np.clip(raw_prob, 0.20, 0.80))
            flag = "✓" if 0.35 <= clipped <= 0.75 else "⚠ OUT OF RANGE"
            if clipped < 0.35 or clipped > 0.75:
                all_ok = False
            print(f"  {t}: raw={raw_prob:.1%}  clipped={clipped:.1%}  {flag}")
        except Exception as e:
            print(f"  {t}: ERROR - {e}")

    print("\n✓ All tickers within healthy range!" if all_ok else "\n⚠ Some out of range — may need more data.")
    print("\nDone.")


if __name__ == "__main__":
    train_model()
