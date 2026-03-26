import requests
import time

def check_tickers(tickers):
    for ticker in tickers:
        print(f"Checking {ticker}...")
        try:
            r = requests.get(f"http://127.0.0.1:8000/predict/{ticker}")
            data = r.json()
            print(f"--- {ticker} ---")
            print(f"Prob: {data.get('beat_probability')}")
            print(f"Signal: {data.get('signal')}")
            # Features are currently nested under top_features in main.py
            tf = data.get('top_features', {})
            print(f"Revenue Growth: {tf.get('revenue_growth')}")
            print(f"Hist Beat Rate: {tf.get('historical_beat_rate')}")
            print(f"Last Surprise: {tf.get('last_surprise_pct')}")
            print(f"Sentiment: {tf.get('sentiment')}")
            print("----------------")
        except Exception as e:
            print(f"Error for {ticker}: {e}")

if __name__ == "__main__":
    check_tickers(["AAPL", "TSLA", "INTC"])
