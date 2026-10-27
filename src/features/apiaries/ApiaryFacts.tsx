import { Card } from '@/components/ui/Card'
import { Fact } from '@/components/ui/Fact'
import { formatAltitude } from '@/lib/format'
import type { Apiary } from './queries'

/** What the apiary record says; empty facts are left out. */
export function ApiaryFacts({ apiary }: { apiary: Apiary }) {
  const facts = [
    ['Finca', apiary.farm_name],
    ['Lugar', apiary.place],
    ['Altitud', apiary.altitude_m === null ? null : formatAltitude(apiary.altitude_m)],
    ['Floración y cultivos cercanos', apiary.flora_notes],
    ['Fuente de agua', apiary.water_source],
    ['Notas', apiary.notes],
  ].filter((fact): fact is [string, string] => Boolean(fact[1]))
  if (!facts.length) return null
  return (
    <Card className="gap-3">
      {facts.map(([label, value]) => (
        <Fact key={label} label={label} value={value} />
      ))}
    </Card>
  )
}

/** Android opens Maps (or any map app) at the pin, without signal if maps are cached. */
export function mapUrl(apiary: Apiary): string | null {
  if (apiary.latitude === null || apiary.longitude === null) return null
  const at = `${apiary.latitude},${apiary.longitude}`
  return `geo:${at}?q=${at}(${encodeURIComponent(apiary.name)})`
}
