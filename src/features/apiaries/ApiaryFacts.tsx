import { Card } from '@/components/ui/Card'
import { Fact } from '@/components/ui/Fact'
import { formatAltitude } from '@/lib/format'
import type { Apiary } from './queries'

/** What the apiary record says; empty facts are left out. */
export function ApiaryFacts({ apiary }: { apiary: Apiary }) {
  const { farm_name, place, altitude_m, flora_notes, water_source, notes } = apiary
  if (
    [farm_name, place, altitude_m, flora_notes, water_source, notes].every(
      (v) => v === null || v === '',
    )
  )
    return null
  return (
    <Card className="gap-3">
      <Fact label="Finca" value={apiary.farm_name} />
      <Fact label="Lugar" value={apiary.place} />
      <Fact
        label="Altitud"
        value={apiary.altitude_m === null ? null : formatAltitude(apiary.altitude_m)}
      />
      <Fact label="Floración y cultivos cercanos" value={apiary.flora_notes} />
      <Fact label="Fuente de agua" value={apiary.water_source} />
      <Fact label="Notas" value={apiary.notes} />
    </Card>
  )
}

/** Android opens Maps (or any map app) at the pin, without signal if maps are cached. */
export function mapUrl(apiary: Apiary): string | null {
  if (apiary.latitude === null || apiary.longitude === null) return null
  const at = `${apiary.latitude},${apiary.longitude}`
  return `geo:${at}?q=${at}(${encodeURIComponent(apiary.name)})`
}
