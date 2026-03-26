import { BrowserRouter, Routes, Route, Link } from "react-router-dom"
import Home from "./pages/Home"
import Search from "./pages/Search"
import StockDetail from "./pages/StockDetail"
import Performance from "./pages/Performance"
import Compare from "./pages/Compare"

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <div className="flex flex-col min-h-screen">
          <header className="bg-slate-900 text-white sticky top-0 z-50 border-b border-slate-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/" className="text-xl font-black tracking-tighter flex items-center gap-2 hover:opacity-90 transition-opacity">
              StockEarnings
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link to="/search" className="text-slate-300 hover:text-white transition-colors">Search</Link>
              <Link to="/compare" className="text-slate-300 hover:text-white transition-colors">Compare</Link>
              <Link to="/performance" className="text-slate-300 hover:text-white transition-colors">Performance</Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/stock/:ticker" element={<StockDetail />} />
            <Route path="/performance" element={<Performance />} />
          </Routes>
        </main>
      </div>
    </div>
    </BrowserRouter>
  )
}

export default App
