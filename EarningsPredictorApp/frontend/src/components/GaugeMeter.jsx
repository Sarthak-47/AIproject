export default function GaugeMeter({ probability, signal }) {
  // SVG arcs: total length is 180 degrees
  // 0-40% red, 40-60% amber, 60-100% green
  const radius = 120;
  const strokeWidth = 24;
  const cx = 150;
  const cy = 150;
  
  // Circumference of full circle
  const circ = 2 * Math.PI * radius;
  // Semicircle length is half circumference
  const semi = circ / 2;

  // We layer 3 paths that share the same semicircle geometry but have different dasharrays
  const d = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;

  // Needle logic
  // probability is 0 to 100.
  // We want to map it to degrees: 0 -> -90deg, 100 -> +90deg
  const safeProb = Math.min(100, Math.max(0, probability));
  const needleRotation = -90 + (safeProb / 100) * 180;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto p-4 text-white">
      <div className="relative w-full aspect-[2/1] overflow-hidden">
        <svg viewBox="0 0 300 160" className="w-full h-full drop-shadow-lg">
          
          {/* Background Track (In case of gaps) */}
          <path d={d} fill="none" stroke="#ffffff20" strokeWidth={strokeWidth} strokeLinecap="round" />
          
          {/* Red Arc: 0 to 40% */}
          {/* Dash trick: solid for length (40% of semi), transparent for rest */}
          <path d={d} fill="none" stroke="#b91c1c" strokeWidth={strokeWidth}
            strokeLinecap="butt"
            strokeDasharray={`${semi * 0.40} ${circ}`} 
            strokeDashoffset={0} 
          />
          
          {/* Amber Arc: 40% to 60% */}
          <path d={d} fill="none" stroke="#b45309" strokeWidth={strokeWidth}
            strokeLinecap="butt"
            strokeDasharray={`${semi * 0.20} ${circ}`} 
            strokeDashoffset={-(semi * 0.40)} 
          />
          
          {/* Green Arc: 60% to 100% */}
          <path d={d} fill="none" stroke="#15803d" strokeWidth={strokeWidth}
            strokeLinecap="butt"
            strokeDasharray={`${semi * 0.40} ${circ}`} 
            strokeDashoffset={-(semi * 0.60)} 
          />

          {/* Needle pivot circle */}
          <circle cx={cx} cy={cy} r={8} fill="white" className="drop-shadow-sm" />
          
          {/* Needle Triangle */}
          {/* Origin at cx,cy. Points upwards (-y direction). Rotated via transform */}
          <polygon 
            points={`${cx - 5},${cy} ${cx + 5},${cy} ${cx},${cy - radius + 10}`} 
            fill="white"
            className="drop-shadow-md transition-transform duration-1000 ease-out"
            style={{ transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${needleRotation}deg)` }}
          />

        </svg>

        {/* Text Overlay centered near bottom */}
        <div className="absolute bottom-2 w-full text-center flex flex-col items-center justify-end">
          <span className="text-5xl md:text-6xl font-black tracking-tighter drop-shadow-md lead tracking-tight">
            {safeProb.toFixed(1)}%
          </span>
          <span className="text-lg md:text-xl font-bold tracking-widest uppercase opacity-90 mt-1">
            {signal}
          </span>
        </div>
      </div>
    </div>
  )
}
