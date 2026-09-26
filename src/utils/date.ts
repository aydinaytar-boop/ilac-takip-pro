// Yerel saat dilimine göre tarih yardımcıları.
// toISOString() UTC döndürdüğü için gece yarısından sonra yanlış güne düşer;
// bu dosya yerel tarihi (YYYY-MM-DD) üretir.

export function toDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateStr(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(s: string, n: number): string {
  const d = parseDateStr(s);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function nowMinutes(d: Date = new Date()): number {
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * "date" (YYYY-MM-DD) bugüne göre kaç gün sonra/önce.
 * Randevu ekranındaki "NaN gün" hatası, tarihin DD.MM.YYYY gibi bir
 * biçimde doğrudan `new Date(str)`'e verilmesinden kaynaklanıyordu;
 * bu fonksiyon her zaman parseDateStr ile yerel YYYY-MM-DD bekler.
 */
export function daysUntil(date: string, now: Date = new Date()): number {
  const target = parseDateStr(date).getTime();
  const today = parseDateStr(toDateStr(now)).getTime();
  return Math.round((target - today) / 86_400_000);
}
