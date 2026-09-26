import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, Undo2, Pill, AlertTriangle } from 'lucide-react';
import type { DoseLog, Medication } from '../types';
import { buildSchedule, summarize } from '../utils/schedule';
import { toDateStr } from '../utils/date';
import StatusBadge from './StatusBadge';
import IconTile from './IconTile';

interface DashboardProps {
  todayLogs: DoseLog[];
  medications: Medication[];
  adherenceRate: number;
  onTake: (medicationId: string, scheduledTime: string) => void;
  onSkip: (medicationId: string, scheduledTime: string) => void;
  onUndo: (medicationId: string, scheduledTime: string) => void;
}

export default function Dashboard({
  todayLogs,
  medications,
  adherenceRate,
  onTake,
  onSkip,
  onUndo,
}: DashboardProps) {
  const { t } = useTranslation();

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const items = buildSchedule(medications, todayLogs, toDateStr(now), now);
  const { taken } = summarize(items);
  const total = items.length;
  const percent = total > 0 ? Math.round((taken / total) * 100) : 0;

  const lowStock = medications.filter(
    (m) =>
      m.stockTracking &&
      typeof m.stockCount === 'number' &&
      m.stockCount <= (m.stockThreshold ?? 5)
  );

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        {t('dashboard.title')}
      </h1>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 mb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <IconTile icon={AlertTriangle} gradient="from-amber-400 to-orange-500" size={24} />
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {t('stock.lowStockTitle')}
            </p>
          </div>
          <ul className="space-y-0.5">
            {lowStock.map((m) => (
              <li key={m.id} className="text-xs text-amber-700 dark:text-amber-400">
                {m.name} — {t('stock.remaining', { count: m.stockCount })}
              </li>
            ))}
          </ul>
        </div>
      )}

      {total === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-sm">
          <IconTile
            icon={Pill}
            gradient="from-blue-500 via-indigo-500 to-violet-600"
            size={56}
            className="mx-auto mb-3"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.noMeds')}</p>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 rounded-2xl p-4 mb-4 shadow-xl shadow-indigo-500/25">
            <div className="pointer-events-none absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-10 -left-6 w-24 h-24 rounded-full bg-white/10" />
            <div className="relative flex items-baseline justify-between mb-2">
              <span className="text-2xl font-bold text-white">
                {taken}/{total}
              </span>
              <span className="text-xs font-medium text-white/90 bg-white/15 px-2 py-1 rounded-full">
                {t('app.adherence', { rate: adherenceRate })}
              </span>
            </div>
            <div
              className="relative h-2 rounded-full bg-white/25 overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
            >
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            {taken === total && (
              <p className="relative mt-3 text-sm font-medium text-white">
                {t('dashboard.allDone')}
              </p>
            )}
          </div>

          <ul className="space-y-2">
            {items.map(({ medication, time, status }) => {
              const done = status === 'taken' || status === 'skipped';
              return (
                <li
                  key={`${medication.id}-${time}`}
                  className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm"
                >
                  <span
                    className="w-1.5 self-stretch rounded-full flex-shrink-0"
                    style={{ backgroundColor: medication.color }}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">
                      {medication.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 flex-wrap">
                      <span>
                        {medication.dosage ? `${medication.dosage} · ` : ''}
                        {time}
                      </span>
                      {(done || status === 'missed') && <StatusBadge status={status} />}
                    </p>
                  </div>

                  {done ? (
                    <button
                      onClick={() => onUndo(medication.id, time)}
                      aria-label={t('actions.undo')}
                      title={t('actions.undo')}
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      <Undo2 size={18} />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onSkip(medication.id, time)}
                        aria-label={t('actions.skip')}
                        title={t('actions.skip')}
                        className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        <X size={18} />
                      </button>
                      <button
                        onClick={() => onTake(medication.id, time)}
                        className="min-h-[40px] flex items-center gap-1 px-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-medium shadow-sm shadow-blue-500/30"
                      >
                        <Check size={16} />
                        {t('actions.take')}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
