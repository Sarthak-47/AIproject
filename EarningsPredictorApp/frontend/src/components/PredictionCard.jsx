import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"

export default function PredictionCard({ result }) {
  const prob = result?.beat_probability ? result.beat_probability * 100 : 50;
  const isBeat = result?.signal === 'BEAT';
  
  // The card background stays green/red based on the definitive signal
  const bgColor = isBeat ? "bg-[#15803d]" : "bg-[#b91c1c]";
  
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(prob);
    }, 100);
    return () => clearTimeout(timer);
  }, [prob]);

  const getConfidenceText = (probability) => {
    if (probability < 35) return "Strong Miss Signal";
    if (probability < 45) return "Lean Miss";
    if (probability <= 55) return "Uncertain";
    if (probability <= 65) return "Lean Beat";
    return "Strong Beat Signal";
  }

  const getBarColor = (probability) => {
    if (probability < 40) return "#ef4444";
    if (probability < 50) return "#f59e0b";
    if (probability <= 65) return "#4ade80";
    return "#15803d";
  }

  const confidenceText = getConfidenceText(prob);
  const barColor = getBarColor(prob);

  return (
    <Card className={`border-none ${bgColor} shadow-lg transition-colors duration-500 text-white min-h-[380px] flex items-center justify-center`}>
      <CardContent className="p-8 md:p-12 w-full flex flex-col items-center justify-center text-center space-y-2">
        <h2 className="text-xl md:text-2xl font-semibold opacity-90 tracking-wide mb-2">Prediction Model</h2>
        
        {/* Large Probability Number and Signal */}
        <div className="flex flex-col items-center justify-center mb-6 mt-4">
          <span className="text-6xl md:text-7xl font-black tracking-tighter drop-shadow-md">
            {prob.toFixed(1)}%
          </span>
          <span className="text-xl md:text-2xl font-bold tracking-widest uppercase opacity-90 mt-2">
            {result?.signal || 'N/A'}
          </span>
        </div>

        {/* Animated Horizontal Probability Bar */}
        <div className="w-full max-w-sm mx-auto mt-4 mb-4">
          <div className="flex justify-between text-xs font-bold opacity-80 mb-2 px-1 uppercase tracking-wider">
            <span>Low</span>
            <span>High</span>
          </div>
          <div 
            className="w-full h-[20px] rounded-full overflow-hidden relative"
            style={{ backgroundColor: 'rgba(0,0,0,0.25)', border: '2px solid rgba(0,0,0,0.3)' }}
          >
            <div 
              className="h-full rounded-full"
              style={{
                width: `${width}%`,
                backgroundColor: barColor,
                transition: 'width 1s ease-out'
              }}
            />
          </div>
        </div>
        
        {/* Confidence Label */}
        <div className="w-full flex justify-center mt-6">
          <span className="text-sm md:text-base font-medium opacity-80 pt-4 border-t border-white/20 w-3/4">
            {confidenceText}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
