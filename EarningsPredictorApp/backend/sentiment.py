from textblob import TextBlob

def get_sentiment(stock):
    try:
        news = stock.news[:5] if stock.news else []
        if not news:
            return 0.0
        titles = ' '.join([n.get('title', '') for n in news])
        score = TextBlob(titles).sentiment.polarity
        return round(score, 3)
    except Exception:
        # Silently return 0.0 if any error occurs
        return 0.0
