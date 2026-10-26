import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'

import type { PrintPage } from './label-html'

/** PDF to WhatsApp, Drive or a print shop; works offline. */
export async function shareLabelsPdf(page: PrintPage, title: string): Promise<void> {
  const { uri } = await Print.printToFileAsync(page)
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: title })
}

/** Android's print dialog (a printer on the network or "Guardar como PDF"). */
export async function printLabels(page: PrintPage): Promise<void> {
  await Print.printAsync(page)
}
