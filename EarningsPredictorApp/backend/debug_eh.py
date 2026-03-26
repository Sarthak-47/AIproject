import yfinance as yf
import pandas as pd
import datetime

def debug_ticker(ticker):
    print(f"--- Debugging {ticker} ---")
    stock = yf.Ticker(ticker)
    eh = stock.earnings_history
    print(f"Type: {type(eh)}")
    if eh is None:
        print("Result: None")
        return
    print(f"Length: {len(eh)}")
    print("Columns:", eh.columns.tolist())
    print("Index type:", type(eh.index))
    print("Head:\n", eh.head())
    
    if len(eh) > 0:
        first_idx = eh.index[0]
        print(f"First Index: {first_idx}, Type: {type(first_idx)}")
        try:
            print(f"Formatted: {first_idx.strftime('%b %Y')}")
        except Exception as e:
            print(f"strftime failed: {e}")

if __name__ == "__main__":
    debug_ticker("AAPL")
