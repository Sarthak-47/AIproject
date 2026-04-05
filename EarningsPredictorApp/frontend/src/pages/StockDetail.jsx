import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import axios from "axios"
import { ArrowLeft, AlertCircle, Share2, Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import PredictionCard from "@/components/PredictionCard"
import KeySignals from "@/components/KeySignals"
import LoadingState from "@/components/LoadingState"
import { Skeleton } from "@/components/ui/skeleton"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

const SECTORS = {
  AAPL: ['MSFT', 'GOOGL', 'META'],
  MSFT: ['AAPL', 'GOOGL', 'CRM'],
  GOOGL: ['META', 'MSFT', 'AAPL'],
  AMZN: ['MSFT', 'GOOGL', 'CRM'],
  TSLA: ['NVDA', 'AMD', 'QCOM'],
  NVDA: ['AMD', 'INTC', 'QCOM'],
  META: ['GOOGL', 'AAPL', 'NFLX'],
  NFLX: ['DIS', 'META', 'GOOGL'],
  JPM: ['BAC', 'V', 'MA'],
  BAC: ['JPM', 'V', 'MA'],
  V: ['MA', 'JPM', 'PYPL'],
  MA: ['V', 'JPM', 'PYPL'],
  JNJ: ['PFE', 'ABBV', 'UNH'],
  PFE: ['JNJ', 'ABBV', 'UNH'],
  WMT: ['HD', 'KO', 'PG'],
  DIS: ['NFLX', 'META', 'GOOGL'],
  AMD: ['NVDA', 'INTC', 'QCOM'],
  INTC: ['AMD', 'NVDA', 'QCOM'],
  XOM: ['CVX', 'COP', 'SLB'],
  KO: ['PG', 'WMT', 'PEP'],
}

export default function StockDetail() {
  const { ticker } = useParams()
  const [data, setData] = useState(null)
  const [history, setHistory] = useState([])
  const [chart, setChart] = useState([])
  const [similarStats, setSimilarStats] = useState([])
  const [countdown, setCountdown] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingSimilar, setLoadingSimilar] = useState(false)
  const [error, setError] = useState(null)
  const [showToast, setShowToast] = useState(false)

  // Manage Recent Tickers
  useEffect(() => {
    try {
      const stored = localStorage.getItem('recentTickers')
      let recents = stored ? JSON.parse(stored) : []
      recents = [ticker.toUpperCase(), ...recents.filter(t => t !== ticker.toUpperCase())]
      recents = recents.slice(0, 5)
      localStorage.setItem('recentTickers', JSON.stringify(recents))
    } catch (e) {
      // fail silently
    }
  }, [ticker])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        // In production (Hugging Face / single container), API is served from same origin
        const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://127.0.0.1:8000")
        
        // --- Core Prediction ---
        // This is non-negotiable for the page to work.
        let predictionData = null
        try {
          const resPred = await axios.get(`${apiUrl}/predict/${ticker}`)
          predictionData = resPred.data
          setData(predictionData)
        } catch (err) {
          throw new Error(err.response?.data?.detail || "Failed to fetch prediction.")
        }

        // --- Secondary Data ---
        // If these fail, we can still show the core page.
        
        // History
        axios.get(`${apiUrl}/history/${ticker}`)
          .then(res => setHistory(res.data || []))
          .catch(e => console.warn("Failed to fetch earnings history:", e))

        // Chart
        axios.get(`${apiUrl}/chart/${ticker}`)
          .then(res => setChart(res.data || []))
          .catch(e => console.warn("Failed to fetch chart data:", e))

        // Countdown
        axios.get(`${apiUrl}/countdown/${ticker}`)
          .then(res => { if (res.data) setCountdown(res.data) })
          .catch(() => {})

        // --- Similar Stocks ---
        const peers = SECTORS[ticker.toUpperCase()]
        if (peers && peers.length > 0) {
          setLoadingSimilar(true)
          const peerPromises = peers.map(peer => 
            axios.get(`${apiUrl}/predict/${peer}`).catch(() => null)
          )
          const peerResults = await Promise.all(peerPromises)
          setSimilarStats(peerResults.filter(r => r && r.data).map(r => r.data))
          setLoadingSimilar(false)
        } else {
          setSimilarStats([])
        }

      } catch (err) {
        setError(err.message || "Failed to load stock data.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [ticker])

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    } catch (err) {
      // fail silently
    }
  }

  const formatSurprise = (val) => {
    if (val === null || val === undefined) return 'N/A'
    const prefix = val > 0 ? '+' : ''
    return `${prefix}${val}%`
  }

  const surpriseColor = (val) => {
    if (val === null || val === undefined) return '#64748b'
    return val > 0 ? '#15803d' : '#b91c1c'
  }

  const formatQuarter = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] p-6 md:p-12 animate-in fade-in duration-500 flex flex-col items-center justify-center">
        <Skeleton className="h-16 w-64 mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl">
          <Skeleton className="h-[400px] w-full col-span-2 rounded-2xl" />
          <Skeleton className="h-[400px] w-full col-span-1 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-500">
        <AlertCircle className="h-16 w-16 text-rose-500 mb-6 drop-shadow-sm" />
        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Stock Not Found</h2>
        <p className="text-lg text-slate-500 mb-8 max-w-md">{error}</p>
        <Button asChild size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all font-bold">
          <Link to="/">Back to Search</Link>
        </Button>
      </div>
    )
  }

  const ft = data?.top_features || {}
  
  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col justify-between">
      <div className="max-w-7xl mx-auto w-full p-6 md:p-12 flex-1">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-4">
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{ticker}</h1>
              <span className="text-lg text-slate-500 font-medium">Earnings Predictor</span>
            </div>
            
            {/* Countdown Badge alongside Next Earnings */}
            <div className="flex items-center space-x-2">
              {data?.next_earnings_date && data.next_earnings_date !== "TBD" && (
                <div className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-900 text-sm font-bold rounded-full border border-amber-200 shadow-sm">
                  Next Earnings: {data.next_earnings_date}
                </div>
              )}
              {countdown && (
                <div className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-900 text-sm font-bold rounded-full border border-orange-200 shadow-sm">
                  In {countdown.days_until} days
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleShare} variant="outline" size="sm" className="hidden sm:flex text-slate-600 border-slate-300 bg-white">
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-slate-500">
              <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Search</Link>
            </Button>
          </div>
        </div>
        
        {/* Simple Toast Overlay for Share */}
        {showToast && (
          <div className="fixed top-20 right-6 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center space-x-2 animate-in slide-in-from-top-4 fade-in z-50">
            <Check className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium">Link copied to clipboard!</span>
          </div>
        )}

        {/* Hero Section: Prediction + Signals */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-10 items-stretch">
          <div className="lg:col-span-3">
            <PredictionCard result={data} />
          </div>
          
          <div className="lg:col-span-2 flex flex-col h-full">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                <span className="w-2 h-6 bg-slate-900 rounded-full mr-3"></span>
                Key Signals
              </h3>
              <div className="flex-1 flex flex-col justify-center">
                <KeySignals key={ticker} ticker={ticker} />
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-xs text-slate-500 leading-relaxed italic">
                  Model relies on walk-forward XGBoost validation. This is a probabilistic signal, not definitive financial advice.
                </p>
                <Link to="/performance" className="text-slate-900 text-xs font-bold mt-3 inline-flex items-center hover:underline">
                  View model performance metrics <ArrowLeft className="ml-1 h-3 w-3 rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Data Section: History + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 items-stretch">
          {/* Earnings History Table */}
          {history.length > 0 && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
                  <span className="w-2 h-6 bg-slate-900 rounded-full mr-3"></span>
                  Earnings History
                </h3>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-y border-slate-200">
                    <tr>
                      <th className="px-4 py-4 font-semibold tracking-wider w-24">Quarter</th>
                      <th className="px-4 py-4 font-semibold tracking-wider text-right">Estimate</th>
                      <th className="px-4 py-4 font-semibold tracking-wider text-right">Actual</th>
                      <th className="px-4 py-4 font-semibold tracking-wider text-right">Surprise %</th>
                      <th className="px-4 py-4 font-semibold tracking-wider text-center w-32">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {history.slice(0, 4).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 font-medium text-slate-900">{formatQuarter(row.quarter)}</td>
                        <td className="px-4 py-4 text-right text-slate-600 font-mono text-xs">{row.estimate !== 0 ? `$${row.estimate.toFixed(2)}` : 'N/A'}</td>
                        <td className="px-4 py-4 text-right text-slate-600 font-mono text-xs">{row.actual !== 0 ? `$${row.actual.toFixed(2)}` : 'N/A'}</td>
                        <td className="px-4 py-4 text-right" style={{ color: surpriseColor(row.surprise), fontWeight: 600 }}>
                          {formatSurprise(row.surprise)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex font-bold px-4 py-1.5 rounded-full text-xs text-white min-w-[70px] justify-center ${row.result === 'BEAT' ? 'bg-[#15803d]' : 'bg-[#b91c1c]'}`}>
                            {row.result}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3-Month Price Chart */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
              <span className="w-2 h-6 bg-slate-900 rounded-full mr-3"></span>
              3-Month Price History
            </h3>
            <div className="flex-1 min-h-[300px]">
              {chart && chart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} minTickGap={30} />
                    <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} tickFormatter={(val) => `$${val}`} />
                    <RechartsTooltip 
                      cursor={{stroke: '#cbd5e1', strokeWidth: 1}} 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => [`$${value}`, "Closing Price"]}
                    />
                    <Line type="monotone" dataKey="close" stroke="#0f172a" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#0f172a', stroke: '#fff', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Chart data unavailable.
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Similar Stocks Footer */}
        {(similarStats.length > 0 || loadingSimilar) && (
          <div className="mb-12">
            <h3 className="text-xl font-bold text-slate-900 mb-6 tracking-tight flex items-center">
              <span className="w-2 h-6 bg-slate-900 rounded-full mr-3"></span>
              Similar Stocks
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {loadingSimilar ? (
                <>
                  <Skeleton className="h-[140px] rounded-2xl" />
                  <Skeleton className="h-[140px] rounded-2xl" />
                  <Skeleton className="h-[140px] rounded-2xl" />
                </>
              ) : (
                similarStats.map((peer) => (
                  <Link key={peer.ticker} to={`/stock/${peer.ticker}`} className="block group">
                    <Card className="hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border-slate-200 overflow-hidden">
                      <CardContent className="p-6 flex flex-col h-full bg-white rounded-2xl group-hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                          <span className="font-black text-2xl text-slate-900">{peer.ticker}</span>
                          <span className={`text-[10px] font-black tracking-widest px-2.5 py-1 rounded text-white uppercase ${peer.signal === 'BEAT' ? 'bg-[#15803d]' : 'bg-[#b91c1c]'}`}>
                            {peer.signal}
                          </span>
                        </div>
                        <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-end">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Confidence</span>
                            <span className="font-black text-slate-900 text-lg">{(peer.beat_probability * 100).toFixed(1)}%</span>
                          </div>
                          <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden">
                             <div 
                                className={`h-full transition-all ${peer.beat_probability > 0.5 ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{ width: `${peer.beat_probability * 100}%` }}
                             />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Full Width Disclaimer */}
      <div className="w-full bg-[#fef3c7] border-l-4 border-[#f59e0b] p-6 text-sm text-[#92400e] mt-20">
        <div className="max-w-7xl mx-auto flex items-start gap-4">
          <span className="text-xl mt-0.5">⚠️</span>
          <p className="text-[0.85rem] leading-relaxed">
            This prediction is generated by a machine learning model trained on historical financial data. It is not financial advice and should not be used as the sole basis for investment decisions. Past performance does not guarantee future results. Always do your own research.
          </p>
        </div>
      </div>
    </div>
  )
}
