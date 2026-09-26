import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, HeartPulse } from 'lucide-react';
import type { BloodPressureReading } from '../types/vitals';
import { categorizeBP, BP_COLORS } from '../utils/vitals';
import IconTile from './IconTile';

interface BloodPressureProps {
  readings: BloodPressureReading[];
  onAdd: (systolic: number, diastolic: number, pulse?: number, note?: string) => void;
  onDelete: (id: string) => void;
}

const INPUT_CLASS =
  'w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 outline-none focus:border-blue-400';

const RANGES: Record<string, string> = {
  normal: '< 120/80',
  elevated: '120-129 / < 80',
  stage1: '130-139 / 80-89',
  stage2: '\u2265 140 / \u2265 90',
  crisis: '> 180 / > 120',
};

const CATEGORY_ORDER = ['normal', 'elevated', 'stage1', 'stage2', 'crisis'] as const;

export default function BloodPressure({ readings, onAdd, onDelete }: BloodPressureProps) {
  const { t, i18n } = useTranslation();
  const [showAdd, setShowAdd] = useState(false);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [note, setNote] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);

  const submit = () => {
    const s = Number(systolic);
    const d = Number(diastolic);
    if (!s || !d) {
      setInvalid(true);
      return;
    }
    onAdd(s, d, pulse ? Number(pulse) : undefined, note);
    setSystolic('');
    setDiastolic('');
    setPulse('');
    setNote('');
    setInvalid(false);
    setShowAdd(false);
  };

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString(i18n.language, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          {t('vitals.bloodPressure.title')}
        </h1>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 min-h-[40px] px-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-sm font-medium shadow-sm shadow-rose-500/30"
          >
            <Plus size={16} />
            {t('vitals.bloodPressure.add')}
          </button>
        )}
      </div>

      {showAdd && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5">
            <IconTile icon={HeartPulse} gradient="from-rose-500 to-red-600" size={30} />
            <h2 className="font-semibold text-sm text-gray-800 dark:text-gray-100">
              {t('vitals.bloodPressure.add')}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1" htmlFor="bp-systolic">
                {t('vitals.bloodPressure.systolic')}
              </label>
              <input
                id="bp-systolic"
                type="number"
                inputMode="numeric"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                aria-invalid={invalid && !Number(systolic)}
                className={`${INPUT_CLASS} ${invalid && !Number(systolic) ? 'border-red-400 dark:border-red-500' : ''}`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1" htmlFor="bp-diastolic">
                {t('vitals.bloodPressure.diastolic')}
              </label>
              <input
                id="bp-diastolic"
                type="number"
                inputMode="numeric"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                aria-invalid={invalid && !Number(diastolic)}
                className={`${INPUT_CLASS} ${invalid && !Number(diastolic) ? 'border-red-400 dark:border-red-500' : ''}`}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1" htmlFor="bp-pulse">
              {t('vitals.bloodPressure.pulse')}
            </label>
            <input
              id="bp-pulse"
              type="number"
              inputMode="numeric"
              value={pulse}
              onChange={(e) => setPulse(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1" htmlFor="bp-note">
              {t('common.note')}
            </label>
            <input
              id="bp-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={submit}
              className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-sm rounded-xl font-medium shadow-sm shadow-rose-500/30"
            >
              {t('medications.save')}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-xl"
            >
              {t('medications.cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 shadow-sm">
        <h2 className="font-semibold text-sm text-gray-800 dark:text-gray-100 mb-2">
          {t('vitals.bloodPressure.categoriesTitle')}
        </h2>
        <ul className="space-y-1.5">
          {CATEGORY_ORDER.map((key) => (
            <li key={key} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${BP_COLORS[key]}`} aria-hidden="true" />
                <span className="text-gray-700 dark:text-gray-200">
                  {t(`vitals.bloodPressure.categories.${key}`)}
                </span>
              </span>
              <span className="text-gray-400 dark:text-gray-500 text-xs">{RANGES[key]}</span>
            </li>
          ))}
        </ul>
      </div>

      <h2 className="font-semibold text-sm text-gray-800 dark:text-gray-100 mb-2">
        {t('vitals.bloodPressure.history')} ({readings.length})
      </h2>

      {readings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-sm">
          <IconTile
            icon={HeartPulse}
            gradient="from-rose-500 to-red-600"
            size={48}
            className="mx-auto mb-3"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('vitals.bloodPressure.noReadings')}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {readings.map((r) => {
            const cat = categorizeBP(r.systolic, r.diastolic);
            return (
              <li key={r.id} className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${BP_COLORS[cat]}`} aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                      {r.systolic}/{r.diastolic}
                      {typeof r.pulse === 'number' ? ` · ${r.pulse} bpm` : ''}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatDateTime(r.takenAt)}</p>
                    {r.note && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-pre-wrap">{r.note}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setConfirmId(r.id)}
                    aria-label={t('medications.delete')}
                    title={t('medications.delete')}
                    className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {confirmId === r.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                      {t('vitals.bloodPressure.confirmDelete')}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onDelete(r.id);
                          setConfirmId(null);
                        }}
                        className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-xl font-medium"
                      >
                        {t('common.yes')}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-xl"
                      >
                        {t('common.no')}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
