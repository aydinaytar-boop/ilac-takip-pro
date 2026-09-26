import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BloodPressureReading, GlucoseReading, GlucoseContext } from '../types/vitals';
import BloodPressure from './BloodPressure';
import Diabetes from './Diabetes';

interface HealthProps {
  bpReadings: BloodPressureReading[];
  onAddBP: (systolic: number, diastolic: number, pulse?: number, note?: string) => void;
  onDeleteBP: (id: string) => void;
  glucoseReadings: GlucoseReading[];
  onAddGlucose: (value: number, context: GlucoseContext, note?: string) => void;
  onDeleteGlucose: (id: string) => void;
}

type Tab = 'bp' | 'glucose';

export default function Health({
  bpReadings,
  onAddBP,
  onDeleteBP,
  glucoseReadings,
  onAddGlucose,
  onDeleteGlucose,
}: HealthProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('bp');

  return (
    <div>
      <div className="flex gap-1 p-1 mb-4 rounded-xl bg-gray-100 dark:bg-gray-800" role="group">
        <button
          onClick={() => setTab('bp')}
          aria-pressed={tab === 'bp'}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            tab === 'bp'
              ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-sm shadow-rose-500/30'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {t('vitals.bloodPressure.title')}
        </button>
        <button
          onClick={() => setTab('glucose')}
          aria-pressed={tab === 'glucose'}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            tab === 'glucose'
              ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-sm shadow-indigo-500/30'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {t('vitals.glucose.title')}
        </button>
      </div>

      {tab === 'bp' ? (
        <BloodPressure readings={bpReadings} onAdd={onAddBP} onDelete={onDeleteBP} />
      ) : (
        <Diabetes readings={glucoseReadings} onAdd={onAddGlucose} onDelete={onDeleteGlucose} />
      )}
    </div>
  );
}
