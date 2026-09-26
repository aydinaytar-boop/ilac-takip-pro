import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, History as HistoryIcon } from 'lucide-react';
import type { DoseLog, Medication } from '../types';
import { buildSchedule, summarize } from '../utils/schedule';
import { addDays, parseDateStr, toDateStr } from '../utils/date';
import StatusBadge from './StatusBadge';
import IconTile from './IconTile';

interface HistoryProps {
  doseLogs: DoseLog[];
  medications: Medication[];
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function History({
  doseLogs,
  medications,
  selectedDate,
  onDateChange,
}: HistoryProps) {
  const { t, i18n } = useTranslation();
  const todayStr = toDateStr();

  // Kalıcı kayıttan gelen tarih bozuksa ya da gelecekteyse bugüne dön
  const date = /^\d{4}-\d{2}-\d{2}$/.test(selectedDate) && selectedDate <= todayStr
    ? selectedDate
    : todayStr;

  const items = buildSchedule(medications, doseLogs, date);
  const { taken, skipped, missed } = summarize(items);

  const label =
    date === todayStr
      ? t('time.today')
      : date === addDays(todayStr, -1)
      ? t('time.yesterday')
      : parseDateStr(date).toLocaleDateString(i18n.language, {
          weekday: 'short',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
    });

  const navButton =
    'min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 text-cyan-600 dark:text-cyan-400 shadow-sm disabled:opacity-40';

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        {t('history.title')}
      </h1>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => onDateChange(addDays(date, -1))}
          aria-label={t('history.date')}
          className={navButton}
        >
          <ChevronLeft size={18} className="rtl:rotate-180" />
        </button>

        <div className="flex-1 text-center">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</p>
          <input
            type="date"
            value={date}
            max={todayStr}
            aria-label={t('history.date')}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            className="mt-1 text-xs bg-transparent text-gray-500 dark:text-gray-400 outline-none text-center"
          />
        </div>

        <button
          onClick={() => onDateChange(addDays(date, 1))}
          disabled={date >= todayStr}
          aria-label={t('history.date')}
          className={navButton}
        >
          <ChevronRight size={18} className="rtl:rotate-180" />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-sm">
          <IconTile
            icon={HistoryIcon}
            gradient="from-cyan-500 to-sky-600"
            size={56}
            className="mx-auto mb-3"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('history.noLogs')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl py-2">
              <p className="text-lg font-bold text-green-700 dark:text-green-300">{taken}</p>
              <p className="text-[11px] text-green-700/80 dark:text-green-300/80">
                {t('dashboard.taken')}
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl py-2">
              <p className="text-lg font-bold text-gray-700 dark:text-gray-200">{skipped}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {t('dashboard.skipped')}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl py-2">
              <p className="text-lg font-bold text-red-600 dark:text-red-300">{missed}</p>
              <p className="text-[11px] text-red-600/80 dark:text-red-300/80">
                {t('dashboard.missed')}
              </p>
            </div>
          </div>

          <ul className="space-y-2">
            {items.map(({ medication, time, status, log }) => (
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {medication.dosage ? `${medication.dosage} · ` : ''}
                    {time}
                    {log?.takenAt ? ` · ${formatTime(log.takenAt)}` : ''}
                  </p>
                </div>
                <StatusBadge status={status} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
