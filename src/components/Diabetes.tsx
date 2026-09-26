import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Droplets } from 'lucide-react';
import type { GlucoseReading, GlucoseContext } from '../types/vitals';
import { categorizeGlucose, GLUCOSE_COLORS } from '../utils/vitals';
import IconTile from './IconTile';

interface DiabetesProps {
  readings: GlucoseReading[];
  onAdd: (value: number, context: GlucoseContext, note?: string) => void;
  onDelete: (id: string) => void;
}

const INPUT_CLASS =
  'w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 outline-none focus:border-blue-400';

const CONTEXTS: GlucoseContext[] = ['fasting', 'postprandial', 'random'];

const RANGES: Record<GlucoseContext, Record<string, string>> = {
  fasting: { low: '< 70', normal: '70-99', prediabetes: '100-125', diabetes: '\u2265 126' },
  postprandial: { low: '< 70', normal: '70-139', prediabetes: '140-199', diabetes: '\u2265 200' },
  random: { low: '< 70', normal: '70-139', prediabetes: '140-199', diabetes: '\u2265 200' },
};

const CATEGORY_ORDER = ['low', 'normal', 'prediabetes', 'diabetes'] as const;

export default function Diabetes({ readings, onAdd, onDelete }: DiabetesProps) {
  const { t, i18n } = useTranslation();
  const [showAdd, setShowAdd] = useState(false);
  const [value, setValue] = useState('');
  const [context, setContext] = useState<GlucoseContext>('fasting');
  const [note, setNote] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);

  const submit = () => {
    const v = Number(value);
    if (!v) {
      setInvalid(true);
      return;
    }
    onAdd(v, context, note);
    setValue('');
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
          {t('vitals.glucose.title')}
        </h1>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 min-h-[40px] px-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-sm font-medium shadow-sm shadow-indigo-500/30"
          >
            <Plus size={16} />
            {t('vitals.glucose.add')}
          </button>
        )}
      </div>

      {showAdd && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5">
            <IconTile icon={Droplets} gradient="from-indigo-500 to-blue-600" size={30} />
            <h2 className="font-semibold text-sm text-gray-800 dark:text-gray-100">
              {t('vitals.glucose.add')}
            </h2>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1" htmlFor="glu-value">
              {t('vitals.glucose.value')}
            </label>
            <input
              id="glu-value"
              type="number"
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-invalid={invalid && !Number(value)}
              className={`${INPUT_CLASS} ${invalid && !Number(value) ? 'border-red-400 dark:border-red-500' : ''}`}
            />
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              {t('vitals.glucose.context')}
            </span>
            <div className="flex gap-2">
              {CONTEXTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setContext(c)}
                  aria-pressed={context === c}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                    context === c
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {t(`vitals.glucose.contexts.${c}`)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1" htmlFor="glu-note">
              {t('common.note')}
            </label>
            <input
              id="glu-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={submit}
              className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-sm rounded-xl font-medium shadow-sm shadow-indigo-500/30"
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
          {t('vitals.glucose.categoriesTitle')}
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
          {t(`vitals.glucose.contexts.${context}`)}
        </p>
        <ul className="space-y-1.5">
          {CATEGORY_ORDER.map((key) => (
            <li key={key} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${GLUCOSE_COLORS[key]}`} aria-hidden="true" />
                <span className="text-gray-700 dark:text-gray-200">
                  {t(`vitals.glucose.categories.${key}`)}
                </span>
              </span>
              <span className="text-gray-400 dark:text-gray-500 text-xs">
                {RANGES[context][key]} mg/dL
              </span>
            </li>
          ))}
        </ul>
      </div>

      <h2 className="font-semibold text-sm text-gray-800 dark:text-gray-100 mb-2">
        {t('vitals.glucose.history')} ({readings.length})
      </h2>

      {readings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-sm">
          <IconTile
            icon={Droplets}
            gradient="from-indigo-500 to-blue-600"
            size={48}
            className="mx-auto mb-3"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('vitals.glucose.noReadings')}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {readings.map((r) => {
            const cat = categorizeGlucose(r.value, r.context);
            return (
              <li key={r.id} className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${GLUCOSE_COLORS[cat]}`} aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                      {r.value} mg/dL
                      <span className="ms-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                        {t(`vitals.glucose.contexts.${r.context}`)}
                      </span>
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
                      {t('vitals.glucose.confirmDelete')}
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
