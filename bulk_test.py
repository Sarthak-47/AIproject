import yfinance as yf

TICKERS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'JNJ',
    'WMT', 'PG', 'MA', 'UNH', 'HD', 'BAC', 'XOM', 'PFE', 'ABBV', 'KO',
    'DIS', 'NFLX', 'INTC', 'AMD', 'PYPL', 'CSCO', 'ADBE', 'CRM', 'QCOM', 'IBM'
]

print(f"{'Ticker':<8} {'Rev Growth':>12} {'Beat Rate':>12} {'Last Surprise':>15}")
print("-" * 55)

for ticker in TICKERS:
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        earnings = stock.earnings_history

        rev = info.get('revenueGrowth')
        rev_str = f"{round(rev*100,1)}%" if rev is not None else "N/A"

        beat_rate = None
        last_surprise = None
        if earnings is not None and len(earnings) > 0:
            col = earnings['surprisePercent'].dropna()
            if len(col) > 0:
                beat_rate = round((col > 0).sum() / len(col) * 100, 1)
                raw = float(col.iloc[0]) * 100
                last_surprise = round(raw, 1) if abs(raw) < 500 else None

        beat_str = f"{beat_rate}%" if beat_rate is not None else "N/A"
        surprise_str = f"{'+' if last_surprise and last_surprise > 0 else ''}{last_surprise}%" if last_surprise is not None else "N/A"

        print(f"{ticker:<8} {rev_str:>12} {beat_str:>12} {surprise_str:>15}")
    except Exception as e:
        print(f"{ticker:<8} ERROR: {str(e)[:40]}")
