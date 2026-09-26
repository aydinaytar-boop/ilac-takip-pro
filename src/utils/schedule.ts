import type { DoseLog, DoseStatus, Medication } from '../types';
import { nowMinutes, timeToMinutes, toDateStr } from './date';

export interface ScheduleItem {
  medication: Medication;
  time: string;
  date: string;
  status: DoseStatus;
  log?: DoseLog;
}

/**
 * Belirli bir gün için planlanan tüm dozları ve durumlarını üretir.
 * - Kayıt varsa kaydın durumu (taken / skipped)
 * - Kayıt yoksa: geçmiş gün veya saati geçmiş doz -> missed, aksi halde upcoming
 * - Pasif ilaçlar yeni doz üretmez, ama o güne ait mevcut kayıtları görünür kalır
 */
export function buildSchedule(
  medications: Medication[],
  logs: DoseLog[],
  date: string,
  now: Date = new Date()
): ScheduleItem[] {
  const today = toDateStr(now);
  const dayLogs = logs.filter((l) => l.date === date);
  const items: ScheduleItem[] = [];

  for (const med of medications) {
    const started = toDateStr(new Date(med.createdAt)) <= date;
    const seen = new Set<string>();

    if (med.active && started) {
      for (const time of med.times) {
        seen.add(time);
        const log = dayLogs.find(
          (l) => l.medicationId === med.id && l.scheduledTime === time
        );
        let status: DoseStatus;
        if (log) status = log.status;
        else if (date < today) status = 'missed';
        else if (date > today) status = 'upcoming';
        else status = timeToMinutes(time) < nowMinutes(now) ? 'missed' : 'upcoming';
        items.push({ medication: med, time, date, status, log });
      }
    }

    // Saati sonradan değiştirilen ya da pasife alınan ilaçların eski kayıtları
    for (const log of dayLogs) {
      if (log.medicationId === med.id && !seen.has(log.scheduledTime)) {
        items.push({ medication: med, time: log.scheduledTime, date, status: log.status, log });
      }
    }
  }

  return items.sort(
    (a, b) =>
      a.time.localeCompare(b.time) ||
      a.medication.name.localeCompare(b.medication.name)
  );
}

export function summarize(items: ScheduleItem[]) {
  const taken = items.filter((i) => i.status === 'taken').length;
  const skipped = items.filter((i) => i.status === 'skipped').length;
  const missed = items.filter((i) => i.status === 'missed').length;
  const upcoming = items.filter((i) => i.status === 'upcoming').length;
  const resolved = taken + skipped + missed;
  return {
    taken,
    skipped,
    missed,
    upcoming,
    resolved,
    // Henüz sonuçlanan doz yoksa oran hesaplanamaz
    rate: resolved > 0 ? Math.round((taken / resolved) * 100) : null,
  };
}
