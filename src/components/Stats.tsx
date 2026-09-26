import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import type { DoseLog, Medication } from '../types';
import { buildSchedule, summarize } from '../utils/schedule';
import type { ScheduleItem } from '../utils/schedule';
import { addDays, parseDateStr, toDateStr } from '../utils/date';
import IconTile from './IconTile';

interface StatsProps {
  doseLogs: DoseLog[];
  medications: Medication[];
}

type Range = 'weekly' | 'monthly';

// Bugünden geriye doğru, tüm planlı dozların alındığı ardışık gün sayısı.
// Bugün henüz bekleyen dozlar varsa seriyi bozmaz, sadece sayılmaz.
function computeStreak(medications: Medication[], logs: DoseLog[], now: Date): number {
  const todayStr = toDateStr(now);
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const date = addDays(todayStr, -i);
    const items = buildSchedule(medications, logs, date, now);
    if (items.length === 0) {
      if (i === 0) continue;
      break;
    }
    if (items.every((it) => it.status === 'taken')) {
      streak++;
    } else if (i === 0 && items.every((it) => it.status === 'taken' || it.status === 'upcoming')) {
      continue;
    } else {
      break;
    }
  }
  return streak;
}

function rateColor(rate: number | null): string {
  if (rate === null) return 'bg-gray-200 dark:bg-gray-700';
  if (rate >= 80) return 'bg-green-500';
  if (rate >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function Stats({ doseLogs, medications }: StatsProps) {
  const { t, i18n } = useTranslation();
  const [range, setRange] = useState<Range>('weekly');

  const now = new Date();
  const todayStr = toDateStr(now);
  const days = range === 'weekly' ? 7 : 30;

  const perDay: { date: string; items: ScheduleItem[] }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(todayStr, -i);
    perDay.push({ date, items: buildSchedule(medications, doseLogs, date, now) });
  }

  const allItems = perDay.flatMap((d) => d.items);
  const totals = summarize(allItems);
  const streak = computeStreak(medications, doseLogs, now);

  const byMed = medications
    .map((med) => {
      const s = summarize(allItems.filter((it) => it.medication.id === med.id));
      return { med, ...s };
    })
    .filter((m) => m.resolved > 0);

  const card = 'bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm';

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        {t('stats.title')}
      </h1>

      <div
        className="flex gap-1 p-1 mb-4 rounded-xl bg-gray-100 dark:bg-gray-800"
        role="group"
      >
        {(['weekly', 'monthly'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setRange(key)}
            aria-pressed={range === key}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              range === key
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {t(`stats.${key}`)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className={card}>
          <IconTile icon={TrendingUp} gradient="from-violet-500 to-purple-600" size={30} className="mb-2" />
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('stats.adherenceRate')}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
            {totals.rate === null ? '–' : `%${totals.rate}`}
          </p>
        </div>
        <div className={card}>
          <IconTile icon={Flame} gradient="from-orange-500 to-red-500" size={30} className="mb-2" />
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('stats.streak')}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
            {streak}
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ms-1">
              {t('stats.days')}
            </span>
          </p>
        </div>
        <div className={card}>
          <IconTile icon={CheckCircle2} gradient="from-emerald-500 to-green-600" size={30} className="mb-2" />
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('stats.totalTaken')}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
            {totals.taken}
          </p>
        </div>
        <div className={card}>
          <IconTile icon={XCircle} gradient="from-slate-400 to-gray-500" size={30} className="mb-2" />
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('stats.totalSkipped')}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-0.5">
            {totals.skipped}
          </p>
        </div>
      </div>

      <div className={`${card} mb-4`}>
        <div className="flex items-end gap-1 h-24" role="img" aria-label={t('stats.adherenceRate')}>
          {perDay.map(({ date, items }) => {
            const { rate } = summarize(items);
            return (
              <div key={date} className="flex-1 h-full flex items-end">
                <div
                  className={`w-full rounded-t ${rateColor(rate)}`}
                  style={{ height: `${rate === null ? 4 : Math.max(rate, 4)}%` }}
                  title={`${date}: ${rate === null ? '–' : `%${rate}`}`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex gap-1 mt-1.5">
          {perDay.map(({ date }, idx) => {
            const d = parseDateStr(date);
            const text =
              range === 'weekly'
                ? d.toLocaleDateString(i18n.language, { weekday: 'short' })
                : idx % 5 === 0 || idx === perDay.length - 1
                ? String(d.getDate())
                : '';
            return (
              <span
                key={date}
                className="flex-1 text-center text-[10px] text-gray-400 dark:text-gray-500 overflow-visible whitespace-nowrap"
              >
                {text}
              </span>
            );
          })}
        </div>
      </div>

      {byMed.length > 0 && (
        <div className={card}>
          <h2 className="font-semibold text-sm text-gray-800 dark:text-gray-100 mb-3">
            {t('stats.byMedication')}
          </h2>
          <ul className="space-y-3">
            {byMed.map(({ med, rate, taken, resolved }) => (
              <li key={med.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: med.color }}
                      aria-hidden="true"
                    />
                    <span className="truncate text-gray-800 dark:text-gray-100">{med.name}</span>
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ms-2">
                    {taken}/{resolved} · %{rate}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${rateColor(rate)}`}
                    style={{ width: `${rate ?? 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
