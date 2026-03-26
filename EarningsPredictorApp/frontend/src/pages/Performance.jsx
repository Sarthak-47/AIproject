import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const chartData = [
  { name: "Q1", accuracy: 62 },
  { name: "Q2", accuracy: 65 },
  { name: "Q3", accuracy: 61 },
  { name: "Q4", accuracy: 67 },
  { name: "Current", accuracy: 66 },
]

export default function Performance() {
  return (
    <div className="min-h-screen p-6 md:p-12 bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Model Performance</h1>
            <p className="text-slate-500">Historical walk-forward validation accuracy.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle>Historical Accuracy</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="accuracy" fill="#0f172a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Walk-forward Validation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-600 text-sm leading-relaxed">
              <p>
                To avoid lookahead bias, our ML pipeline uses strict <strong>walk-forward validation</strong>.
              </p>
              <p>
                The model is trained <em>exclusively</em> on data available prior to the predicted earnings quarter. When we state our accuracy is 65%, that means if you followed the model blindly over the last 12 months, it correctly predicted a hit or miss 65% of the time—a substantial edge over randomness.
              </p>
              <p className="pt-4 border-t border-slate-100">
                <strong>Current Baseline:</strong> 60-65% Accuracy<br/>
                <strong>Model:</strong> XGBoost Classifier<br/>
                <strong>Features:</strong> 35 Quantitative + NLP Signals
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works Flow */}
        <div className="pt-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mb-4">1</div>
                <h3 className="font-bold text-slate-900 mb-2">Data Collection</h3>
                <p className="text-sm text-slate-500">Pulls real-time quarterly financials, price history, and analyst estimates directly via yfinance API.</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mb-4">2</div>
                <h3 className="font-bold text-slate-900 mb-2">Feature Engineering</h3>
                <p className="text-sm text-slate-500">Calculates momentum, volatility bounds, historical beat rates, and surprises dynamically on the fly.</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold mb-4">3</div>
                <h3 className="font-bold text-slate-900 mb-2">Signal Prediction</h3>
                <p className="text-sm text-slate-500">Weights multiple signals logically to produce a mathematically grounded beat/miss probability.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Key Features Used */}
        <div className="pt-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Key Pipeline Features</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { name: "Historical Beat Rate", cat: "Fundamental" },
              { name: "Last Surprise %", cat: "Fundamental" },
              { name: "30-Day Price Momentum", cat: "Technical" },
              { name: "Trailing 4Q EPS", cat: "Fundamental" },
              { name: "Revenue Growth", cat: "Fundamental" },
              { name: "Price Volatility", cat: "Technical" },
              { name: "Pre-earnings Drift", cat: "Technical" },
              { name: "Analyst Revisions", cat: "Sentiment" },
              { name: "News Sentiment", cat: "Sentiment" },
            ].map((feature) => (
              <div key={feature.name} className="flex flex-col p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{feature.cat}</span>
                <span className="font-medium text-slate-800">{feature.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Limitations */}
        <div className="pt-4 pb-12">
          <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl shadow-sm flex items-start space-x-4">
            <div className="text-amber-600 font-bold text-xl">!</div>
            <div>
              <h3 className="text-lg font-bold text-amber-900 mb-1">Model Limitations</h3>
              <p className="text-sm text-amber-800/80 leading-relaxed">
                This model relies exclusively on publicly available historical data and current technical momentum. It does not have access to insider information, alternative data (credit card receipts, foot traffic), private supply chain data, or real-time institutional order flow. Treat these probabilities as one quantitative signal among many in your broader fundamental research.
              </p>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}
