# Project Explanation: Earnings Surprise Predictor

This document provides a comprehensive overview of the **Earnings Surprise Predictor** project, detailing its purpose, data acquisition methods, modeling logic, and system architecture.

---

## 1. What is this Project?

The **Earnings Surprise Predictor** is a financial technology application designed to forecast whether a company will "beat" or "miss" its earnings expectations before an official announcement.

### The Problem
When a company reports its quarterly earnings, the market compares the **Actual EPS** (Earnings Per Share) to the **Estimated EPS** (what analysts predicted). 
- If the actual is significantly higher than the estimate, it's a **Positive Surprise**.
- If it's significantly lower, it's a **Negative Surprise**.
These surprises often trigger massive stock price movements.

### The Goal
Our goal is to build a tool that uses historical data and current market signals to predict these surprises with a confidence score, helping investors make informed decisions before the announcement. We define a "significant" surprise as a **±15% change** from the analyst estimate.

---

## 2. How we get the Data

The project uses a multi-layered data sourcing strategy to ensure both historical depth and live accuracy.

### Historical Training Data
Originally, the project extracted a massive dataset (2012–2022) for over 2,000 U.S. companies.
- **Source**: Financial Modeling Prep (FMP) API.
- **Storage**: AWS RDS MySQL database.
- **Types**: 
    - **Earnings Data**: Past dates, times, estimates, and actuals.
    - **Pricing Data**: Open, High, Low, Close, and Volume for the day prior to earnings.
    - **Technical Data**: Moving averages (SMA/WMA), RSI, and volatility for 5, 10, and 20-day windows.

### Live Application Data
The live web app fetches real-time data to provide up-to-the-minute predictions.
- **Source**: `yfinance` (Yahoo Finance API).
- **Process**: When you type a ticker (e.g., AAPL), the backend:
    1. Fetches the last 4–8 quarters of earnings history.
    2. Calculates the current revenue growth and historical "beat rate."
    3. Analyzes recent price momentum (last 30 days).
    4. Scrapes recent news to perform **Sentiment Analysis**.

---

## 3. The Model: Random Forest vs. Weighted Scoring

### The Original Model (Research Phase)
During the research phase (documented in the Jupyter Notebook), we trained a **Random Forest Classifier**.
- **Why Random Forest?** 
    - It handles non-linear relationships well (e.g., how Volume + RSI together might signal a beat).
    - It provides **Feature Importance**, allowing us to see which metrics (like Analyst Estimates or Historical Beat Rate) matter most.
- **Outcome**: The model identified that **Analyst Estimates** and **Lagged Earnings Features** (how the company performed in the previous 2 quarters) were the strongest predictors.

### The Production Logic (Live App Phase)
In the live FastAPI backend, we implemented a **Weighted Analytical Scoring System** based on the insights from the Random Forest model.

**Why change from the raw ML model?**
The ML model became biased toward large S&P 500 stocks (which almost always beat by a tiny margin), giving them all the same "75% probability." To provide more granular, ticker-specific signals, we use a formula that weights four key signals:

1.  **Historical Beat Rate (40%)**: Does this company traditionally beat expectations?
2.  **Previous Surprise Momentum (20%)**: Did they crush it last quarter?
3.  **Price Momentum (25%)**: Is the stock trending up or down in the 30 days leading to earnings?
4.  **Market Uncertainty (15%)**: Current volatility acts as a "dampener"—if the stock is swinging wildly, we pull the prediction closer to a neutral 50%.

---

## 4. Technical Architecture

The project is split into two main parts:

### Backend (The Brain)
- **Framework**: FastAPI (Python).
- **Core Logic**: `main.py` handles API requests; `per_quarter_features.py` calculates the math; `sentiment.py` uses NLP to gauge news tone.
- **Deployment**: Configured for Render/Cloud environments.

### Frontend (The Face)
- **Framework**: React.js with Vite.
- **Styling**: Modern CSS with "glassmorphism" effects and dark mode.
- **Visuals**: 
    - **Gauge Meters**: Show the "Beat Probability."
    - **Key Signal Cards**: Break down Revenue Growth, Beat Rate, and Sentiment.
    - **Interactive Charts**: Show price history using Recharts.

---

## 5. Summary Workflow
1.  **User enters ticker**.
2.  **Backend** calls `yfinance` → downloads latest financials + news.
3.  **Feature Engine** calculates growth, momentum, and historical patterns.
4.  **Model/Scoring** produces a `Beat %` and a `Signal` (BEAT/MISS).
5.  **Frontend** displays the data in a premium, easy-to-read dashboard.
