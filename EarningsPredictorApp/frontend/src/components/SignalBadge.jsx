import { Badge } from "@/components/ui/badge"

export default function SignalBadge({ signal }) {
  const isBeat = signal === 'BEAT';
  return (
    <Badge 
      variant={isBeat ? 'success' : 'destructive'} 
      className="px-4 py-1 text-base uppercase tracking-widest shadow-sm rounded-full"
    >
      {signal}
    </Badge>
  )
}
