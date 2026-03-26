import { Progress } from "@/components/ui/progress"

export default function FeatureBar({ label, value, progressValue, suffix = "", colorClass = "bg-slate-900" }) {
  return (
    <div className="flex flex-col space-y-2 py-2">
      <div className="flex justify-between text-sm font-medium">
        <span className="text-slate-600 font-semibold">{label}</span>
        <span className="text-slate-900 font-bold">{value}{suffix}</span>
      </div>
      <Progress 
        value={progressValue} 
        className="h-2 w-full bg-slate-100" 
        indicatorClassName={colorClass}
      />
    </div>
  )
}
