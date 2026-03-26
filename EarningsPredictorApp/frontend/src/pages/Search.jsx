import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search as SearchIcon } from "lucide-react"

export const TICKERS = [
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
]

export default function Search() {
  const [query, setQuery] = useState("")
  const navigate = useNavigate()

  const filtered = TICKERS.filter(t => 
    t.symbol.toLowerCase().includes(query.toLowerCase()) || 
    t.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f8fafc] flex flex-col pt-12 px-6">
      <div className="max-w-6xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        {/* Header / Search Input */}
        <div className="space-y-4 text-center pb-8 border-b border-slate-200">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Stock Screener</h1>
          <p className="text-slate-500 text-lg">Browse and predict earnings for the S&P 500 universe.</p>
          
          <div className="relative w-full max-w-2xl mx-auto mt-6">
            <div className="relative flex items-center w-full border-2 border-slate-300 rounded-xl bg-white focus-within:ring-4 focus-within:ring-slate-900/10 focus-within:border-slate-900 transition-all">
              <SearchIcon className="absolute left-4 h-6 w-6 text-slate-400" />
              <input 
                autoFocus
                className="w-full bg-transparent pl-12 pr-4 py-4 text-lg outline-none rounded-xl placeholder:text-slate-400"
                placeholder="Filter by ticker or company name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Ticker Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
          {filtered.length > 0 ? (
            filtered.map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => navigate(`/stock/${stock.symbol}`)}
                className="group flex flex-col items-start p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left outline-none focus:ring-2 focus:ring-slate-900"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="font-extrabold text-xl text-slate-900">{stock.symbol}</span>
                  <div className="bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                    Predict &rarr;
                  </div>
                </div>
                <span className="text-slate-500 text-sm truncate w-full">{stock.name}</span>
              </button>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-slate-500 text-lg">
              No companies found matching "{query}".
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
