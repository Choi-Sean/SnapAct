// Formats a real, extracted ReceiptPayload as the same kind of monospace
// item-table text ReviewModal.tsx's demo receipt preview uses
// (formatReceiptTable there) — reused here so a real analysis looks the
// same way the demo already showed the user it would.
import { Dictionary } from './i18n/dictionaries';
import { ReceiptPayload } from './types';

export function formatReceiptTable(receipt: ReceiptPayload, t: Dictionary): string {
  const lines: string[] = [];

  const header = [receipt.store, receipt.date].filter(Boolean).join('  ·  ');
  if (header) lines.push(header);

  if (receipt.items?.length) {
    if (header) lines.push('');
    for (const item of receipt.items) {
      const name = (item.name ?? '').padEnd(14, ' ');
      lines.push(`${name} ${item.price ?? ''}`);
    }
  }

  const hasTotals = receipt.subtotal || receipt.tax || receipt.total;
  if (hasTotals) {
    lines.push('------------------------');
    if (receipt.subtotal) lines.push(`${t.home.receiptSubtotalLabel.padEnd(12, ' ')}${receipt.subtotal}`);
    if (receipt.tax) lines.push(`${t.home.receiptTaxLabel.padEnd(12, ' ')}${receipt.tax}`);
    if (receipt.total) lines.push(`${t.home.receiptTotalLabel.padEnd(12, ' ')}${receipt.total}`);
  }

  if (receipt.due_date) {
    const due = new Date(receipt.due_date);
    lines.push('');
    lines.push(`${t.home.receiptDueLabel.padEnd(12, ' ')}${Number.isNaN(due.getTime()) ? receipt.due_date : due.toLocaleDateString()}`);
  }

  return lines.join('\n');
}
