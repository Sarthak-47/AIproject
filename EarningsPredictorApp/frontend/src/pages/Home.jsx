import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Brain, Activity, Clock } from "lucide-react"
import axios from "axios"

const TICKERS = [
  { symbol: "AAPL", name: "Apple" }, { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Google" }, { symbol: "AMZN", name: "Amazon" },
  { symbol: "TSLA", name: "Tesla" }, { symbol: "META", name: "Meta" },
  { symbol: "NVDA", name: "Nvidia" }, { symbol: "JPM", name: "JPMorgan" },
  { symbol: "V", name: "Visa" }, { symbol: "JNJ", name: "Johnson & Johnson" },
  { symbol: "WMT", name: "Walmart" }, { symbol: "PG", name: "Procter & Gamble" },
  { symbol: "MA", name: "Mastercard" }, { symbol: "UNH", name: "UnitedHealth" },
  { symbol: "HD", name: "Home Depot" }, { symbol: "BAC", name: "Bank of America" },
  { symbol: "XOM", name: "ExxonMobil" }, { symbol: "PFE", name: "Pfizer" },
  { symbol: "ABBV", name: "AbbVie" }, { symbol: "KO", name: "Coca-Cola" },
  { symbol: "DIS", name: "Disney" }, { symbol: "NFLX", name: "Netflix" },
  { symbol: "INTC", name: "Intel" }, { symbol: "AMD", name: "AMD" },
  { symbol: "PYPL", name: "PayPal" }, { symbol: "CSCO", name: "Cisco" },
  { symbol: "ADBE", name: "Adobe" }, { symbol: "CRM", name: "Salesforce" },
  { symbol: "QCOM", name: "Qualcomm" }, { symbol: "IBM", name: "IBM" }
];

const POPULAR_STOCKS = ["AAPL", "TSLA", "NVDA", "MSFT", "GOOGL", "AMZN"];

export default function Home() {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [marketData, setMarketData] = useState(null)
  const [recentTickers, setRecentTickers] = useState([])
  const navigate = useNavigate()
  const wrapperRef = useRef(null)

  const filtered = TICKERS.filter(t => 
    t.symbol.toLowerCase().includes(query.toLowerCase()) || 
    t.name.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    // Fetch market data
    const fetchMarket = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
        const res = await axios.get(`${apiUrl}/market`)
        if (res.data) setMarketData(res.data)
      } catch (err) {
        // Fail silently
      }
    }
    fetchMarket()

    // Load recent tickers from localStorage
    try {
      const stored = localStorage.getItem('recentTickers')
      if (stored) {
        setRecentTickers(JSON.parse(stored))
      }
    } catch (e) {
      // Fail silently
    }
  }, [])

  const handleSelect = (symbol) => {
    setOpen(false)
    navigate(`/stock/${symbol}`)
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col animate-gradient-x bg-gradient-to-r from-[#f8fafc] via-[#e2e8f0] to-[#f8fafc] bg-[length:200%_200%]">
      
      {/* Sub-header Live Stats Bar */}
      <div className="w-full bg-slate-800 text-slate-300 py-2 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 text-xs md:text-sm font-medium flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-center tracking-wide">
          <span>30 S&P 500 Stocks Tracked</span>
          <span className="hidden sm:inline text-slate-500">•</span>
          <span>60-65% Walk-forward Accuracy</span>
          <span className="hidden md:inline text-slate-500">•</span>
          <span className="hidden md:inline">Live Data via yfinance</span>
          <span className="hidden lg:inline text-slate-500">•</span>
          <span className="hidden lg:inline">Model: XGBoost + NLP</span>
        </div>
      </div>

      {/* Bull/Bear Banner */}
      {marketData && (
        <div className={`w-full py-2 text-center text-sm font-bold tracking-wide border-b ${
          marketData.direction === 'up' 
            ? 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]' 
            : 'bg-[#fee2e2] text-[#b91c1c] border-[#fecaca]'
        }`}>
          {marketData.direction === 'up' ? '📈' : '📉'} {marketData.label} — Market is {marketData.direction === 'up' ? 'bullish' : 'bearish'}
        </div>
      )}

      <div className="flex-1 flex flex-col items-center pt-20 pb-12 px-6">
        <div className="w-full max-w-4xl space-y-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-slate-900">Predict Earnings Before They Happen</h1>
            <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto">
              ML-powered Beat/Miss predictions for S&P 500 stocks
            </p>
          </div>
          
          {/* Search Bar */}
          <div ref={wrapperRef} className="relative w-full text-left mx-auto max-w-2xl z-20">
            <div className="relative flex items-center w-full border-2 border-slate-300 rounded-2xl bg-white shadow-lg focus-within:ring-4 focus-within:ring-slate-900/10 focus-within:border-slate-900 transition-all">
              <Search className="absolute left-6 h-6 w-6 text-slate-400" />
              <input 
                className="w-full bg-transparent pl-16 pr-6 py-5 text-xl outline-none rounded-2xl placeholder:text-slate-400"
                placeholder="Search ticker or company (e.g. AAPL)..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setOpen(true)
                }}
                onFocus={() => setOpen(true)}
              />
            </div>

            {open && filtered.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-80 overflow-y-auto">
                <div className="p-2">
                  {filtered.map((stock) => (
                    <button
                      key={stock.symbol}
                      onClick={() => handleSelect(stock.symbol)}
                      className="w-full text-left px-4 py-4 hover:bg-slate-50 rounded-lg flex items-center justify-between transition-colors outline-none focus:bg-slate-50"
                    >
                      <span className="font-bold text-slate-900 text-lg">{stock.symbol}</span>
                      <span className="text-slate-500 text-sm">{stock.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {open && query && filtered.length === 0 && (
              <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-2xl p-8 text-center text-slate-500">
                No results found for "{query}".
              </div>
            )}
          </div>
          
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-8">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 shadow-sm text-left">
              <Brain className="h-8 w-8 text-slate-900 mb-4" />
              <h3 className="font-bold text-slate-900 text-lg mb-1">ML Powered</h3>
              <p className="text-slate-500 text-sm">XGBoost model trained on 35 financial signals</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 shadow-sm text-left">
              <Activity className="h-8 w-8 text-slate-900 mb-4" />
              <h3 className="font-bold text-slate-900 text-lg mb-1">60-65% Accurate</h3>
              <p className="text-slate-500 text-sm">Beating the 50% random baseline consistently</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 shadow-sm text-left">
              <Clock className="h-8 w-8 text-slate-900 mb-4" />
              <h3 className="font-bold text-slate-900 text-lg mb-1">Live Data</h3>
              <p className="text-slate-500 text-sm">Real-time financials pulled fresh for every prediction</p>
            </div>
          </div>
          
          {/* Popular Stocks */}
          <div className="pt-8 space-y-4">
            <h4 className="text-sm font-semibold tracking-wider text-slate-500 uppercase">Popular Stocks</h4>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {POPULAR_STOCKS.map(ticker => (
                <button
                  key={ticker}
                  onClick={() => handleSelect(ticker)}
                  className="px-6 py-2 rounded-full border-2 border-slate-900 text-slate-900 font-bold hover:bg-slate-900 hover:text-white transition-colors"
                >
                  {ticker}
                </button>
              ))}
            </div>
          </div>

          {/* Recently Viewed */}
          {recentTickers.length > 0 && (
            <div className="pt-2 space-y-4">
              <h4 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Recently Viewed</h4>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {recentTickers.map(ticker => (
                  <button
                    key={ticker}
                    onClick={() => handleSelect(ticker)}
                    className="px-6 py-1.5 rounded-full border border-slate-300 text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900 transition-colors text-sm bg-white shadow-sm"
                  >
                    {ticker}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
