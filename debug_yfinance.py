import yfinance as yf

for ticker in ['AAPL', 'TSLA', 'INTC']:
    stock = yf.Ticker(ticker)
    info = stock.info
    hist = stock.history(period='3mo')
    earnings = stock.earnings_history

    print(f"\n========== {ticker} ==========")
    print(f"revenueGrowth:    {info.get('revenueGrowth')}")
    print(f"grossMargins:     {info.get('grossMargins')}")
    print(f"trailingEps:      {info.get('trailingEps')}")
    if len(hist) >= 5:
        price_change = (hist['Close'].iloc[-1] - hist['Close'].iloc[-5]) / hist['Close'].iloc[-5]
        print(f"5d price change:  {price_change}")
    else:
        print(f"5d price change:  N/A")
    if earnings is not None and len(earnings) > 0:
        print(f"earnings rows:    {len(earnings)}")
        print(f"columns:          {list(earnings.columns)}")
        print(f"first row:        {earnings.iloc[0].to_dict()}")
    else:
        print(f"earnings:         None or empty")
    print(f"==============================")
