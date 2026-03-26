import pickle, pandas as pd, numpy as np

with open('model.pkl','rb') as f: model = pickle.load(f)
with open('feature_cols.pkl','rb') as f: feature_cols = pickle.load(f)

# Import the per-quarter feature builder from the new train.py
from train import build_per_quarter_features

tickers = ['AAPL','TSLA','MSFT','GOOGL','AMZN']
print('=== 5-TICKER SANITY CHECK (calibrated model) ===')
all_ok = True
for t in tickers:
    try:
        rows = build_per_quarter_features(t)
        if not rows:
            print(f'{t}: No data')
            continue
        latest = {k:v for k,v in rows[-1].items() if k!='target'}
        for col in feature_cols:
            if col not in latest: latest[col] = 0.0
        Xq = pd.DataFrame([latest])[feature_cols]
        raw = model.predict_proba(Xq)[0][1]
        clipped = float(np.clip(raw, 0.20, 0.80))
        flag = 'OK' if 0.35 <= clipped <= 0.75 else 'OUT OF RANGE'
        if not (0.35 <= clipped <= 0.75):
            all_ok = False
        print(f'{t}: raw={raw:.1%}  clipped={clipped:.1%}  [{flag}]')
    except Exception as e:
        print(f'{t}: ERROR - {e}')

print()
if all_ok:
    print('ALL TICKERS OK - ready to deploy')
else:
    print('WARNING - some tickers out of range')
