import { useState, useRef, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { ArrowLeft, Search, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import PredictionCard from "@/components/PredictionCard"
import KeySignals from "@/components/KeySignals"
import { Skeleton } from "@/components/ui/skeleton"

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
]

function TickerSearch({ value, onChange, placeholder }) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => { setQuery(value) }, [value])

  const filtered = TICKERS.filter(t => 
    t.symbol.toLowerCase().includes(query.toLowerCase()) || 
    t.name.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={wrapperRef} className="relative w-full z-20 text-left">
      <div className="relative flex items-center w-full border border-slate-300 rounded-xl bg-white focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-900 transition-all">
        <Search className="absolute left-4 h-5 w-5 text-slate-400" />
        <input 
          className="w-full bg-transparent pl-12 pr-4 py-3 text-base outline-none rounded-xl placeholder:text-slate-400 font-medium text-slate-900 uppercase uppercase-placeholder:normal-case focus:uppercase"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            setQuery("")
            setOpen(true)
          }}
        />
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-60 overflow-y-auto">
          <div className="p-1">
            {filtered.map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => {
                  onChange(stock.symbol)
                  setQuery(stock.symbol)
                  setOpen(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-100 rounded-md flex items-center justify-between transition-colors outline-none"
              >
                <span className="font-bold text-slate-900">{stock.symbol}</span>
                <span className="text-slate-500 text-sm whitespace-nowrap overflow-hidden text-ellipsis ml-4">{stock.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ColumnResult({ ticker, loading, data, error }) {
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-24 mb-6" />
        <Skeleton className="h-[380px] w-full rounded-2xl" />
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <Skeleton className="h-6 w-32 mb-6" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 p-8 rounded-2xl flex flex-col items-center justify-center text-center h-[500px]">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h3 className="text-xl font-bold text-rose-900 mb-2">Analysis Failed</h3>
        <p className="text-rose-700">{error}</p>
      </div>
    )
  }

  if (!data) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 delay-100 slide-in-from-bottom-4">
      <div className="flex items-center space-x-3 mb-2 px-2">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{ticker}</h2>
      </div>

      <PredictionCard result={data} />
      
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Key Signals</h3>
        <KeySignals key={ticker} ticker={ticker} />
      </div>
    </div>
  )
}

export default function Compare() {
  const [ticker1, setTicker1] = useState("")
  const [ticker2, setTicker2] = useState("")
  
  const [loading1, setLoading1] = useState(false)
  const [loading2, setLoading2] = useState(false)
  
  const [data1, setData1] = useState(null)
  const [data2, setData2] = useState(null)
  
  const [error1, setError1] = useState(null)
  const [error2, setError2] = useState(null)

  const handleCompare = async () => {
    if (!ticker1 || !ticker2) return;
    
    setLoading1(true)
    setLoading2(true)
    setError1(null)
    setError2(null)
    
    const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

    // Fetch both simultaneously but process results independently
    Promise.allSettled([
      axios.get(`${apiUrl}/predict/${ticker1}`),
      axios.get(`${apiUrl}/predict/${ticker2}`)
    ]).then(([res1, res2]) => {
      
      // Handle Result 1
      if (res1.status === 'fulfilled') {
        setData1(res1.value.data)
      } else {
        setError1(res1.reason?.response?.data?.detail || `Failed to fetch ${ticker1}`)
      }
      setLoading1(false)

      // Handle Result 2
      if (res2.status === 'fulfilled') {
        setData2(res2.value.data)
      } else {
        setError2(res2.reason?.response?.data?.detail || `Failed to fetch ${ticker2}`)
      }
      setLoading2(false)
    })
  }

  return (
    <div className="min-h-[calc(100vh-64px)] p-6 md:p-12 bg-slate-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="text-slate-500 -ml-3">
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Home</Link>
          </Button>
        </div>

        <div className="mb-10 text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Stock Comparison</h1>
          <p className="text-slate-500 text-lg">Select two companies to compare their quantitative earnings models side-by-side.</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-12 max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-4 relative z-50">
          <div className="flex-1 w-full">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Asset 1</div>
            <TickerSearch value={ticker1} onChange={setTicker1} placeholder="Ticker 1 (e.g. AAPL)" />
          </div>
          <div className="flex items-center justify-center pt-6 px-2 text-slate-300 font-bold hidden md:block">VS</div>
          <div className="flex-1 w-full mt-2 md:mt-0">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Asset 2</div>
            <TickerSearch value={ticker2} onChange={setTicker2} placeholder="Ticker 2 (e.g. MSFT)" />
          </div>
          <div className="pt-6 w-full md:w-auto">
            <Button 
              size="lg" 
              onClick={handleCompare} 
              disabled={!ticker1 || !ticker2 || loading1 || loading2}
              className="w-full md:w-auto font-bold tracking-wide rounded-xl shadow-md min-w-[120px]"
            >
              Compare
            </Button>
          </div>
        </div>

        {/* Dual Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 relative z-0">
          <div>
            {(data1 || loading1 || error1) && (
              <ColumnResult ticker={ticker1} loading={loading1} data={data1} error={error1} />
            )}
          </div>
          <div>
            {(data2 || loading2 || error2) && (
              <ColumnResult ticker={ticker2} loading={loading2} data={data2} error={error2} />
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
