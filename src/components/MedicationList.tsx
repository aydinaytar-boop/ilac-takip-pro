import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, X, PackagePlus, Pill } from 'lucide-react';
import { MED_COLORS, DEFAULT_STOCK_THRESHOLD } from '../types';
import type { Medication } from '../types';
import IconTile from './IconTile';

type MedInput = Omit<Medication, 'id' | 'createdAt'>;

interface MedicationListProps {
  medications: Medication[];
  profileId: string;
  onAdd: (med: MedInput) => void;
  onUpdate: (id: string, updates: Partial<Medication>) => void;
  onDelete: (id: string) => void;
  onRefill: (id: string, amount: number) => void;
}

const INPUT_CLASS =
  'w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 outline-none focus:border-blue-400';

// Renk kutucuğundan CSS gradyan stringi üretir (IconTile Tailwind bekliyor,
// burada inline style ile aynı görsel dili uyguluyoruz).
function colorGradientStyle(hex: string) {
  return { backgroundImage: `linear-gradient(135deg, ${hex}, ${hex}cc)` };
}

// Form bileşeni dışarıda tanımlı: her tuş vuruşunda yeniden oluşturulmaz, odak kaybolmaz.
function MedForm({
  initial,
  profileId,
  onSubmit,
  onCancel,
}: {
  initial?: Medication;
  profileId: string;
  onSubmit: (med: MedInput) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial?.name ?? '');
  const [dosage, setDosage] = useState(initial?.dosage ?? '');
  const [times, setTimes] = useState<string[]>(
    initial && initial.times.length > 0 ? initial.times : ['08:00']
  );
  const [color, setColor] = useState(initial?.color ?? MED_COLORS[0]);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [active, setActive] = useState(initial?.active ?? true);
  const [stockTracking, setStockTracking] = useState(initial?.stockTracking ?? false);
  const [stockCount, setStockCount] = useState(initial?.stockCount ?? 0);
  const [stockThreshold, setStockThreshold] = useState(
    initial?.stockThreshold ?? DEFAULT_STOCK_THRESHOLD
  );
  const [invalid, setInvalid] = useState(false);

  const submit = () => {
    const cleanTimes = Array.from(new Set(times.filter(Boolean))).sort();
    if (!name.trim() || cleanTimes.length === 0) {
      setInvalid(true);
      return;
    }
    onSubmit({
      profileId,
      name: name.trim(),
      dosage: dosage.trim(),
      times: cleanTimes,
      color,
      notes: notes.trim() || undefined,
      active,
      stockTracking,
      stockCount: stockTracking ? Math.max(0, stockCount) : undefined,
      stockThreshold: stockTracking ? Math.max(0, stockThreshold) : undefined,
    });
  };

  const label = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2.5">
        <IconTile icon={Pill} gradient="from-emerald-500 to-teal-600" size={30} />
        <h2 className="font-semibold text-sm text-gray-800 dark:text-gray-100">
          {initial ? t('medications.edit') : t('medications.add')}
        </h2>
      </div>

      <div>
        <label className={label} htmlFor="med-name">{t('medications.name')}</label>
        <input
          id="med-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={invalid && !name.trim()}
          className={`${INPUT_CLASS} ${invalid && !name.trim() ? 'border-red-400 dark:border-red-500' : ''}`}
        />
      </div>

      <div>
        <label className={label} htmlFor="med-dosage">{t('medications.dosage')}</label>
        <input
          id="med-dosage"
          type="text"
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <span className={label}>{t('medications.times')}</span>
        <div className="space-y-2">
          {times.map((time, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="time"
                value={time}
                onChange={(e) =>
                  setTimes((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                }
                className={INPUT_CLASS}
              />
              {times.length > 1 && (
                <button
                  type="button"
                  onClick={() => setTimes((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label={t('medications.delete')}
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setTimes((prev) => [...prev, '12:00'])}
          className="mt-2 flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400"
        >
          <Plus size={14} />
          {t('medications.addTime')}
        </button>
        {invalid && times.filter(Boolean).length === 0 && (
          <p className="mt-1 text-xs text-red-500">{t('common.error')}</p>
        )}
      </div>

      <div>
        <span className={label}>{t('medications.color')}</span>
        <div className="flex flex-wrap gap-2">
          {MED_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={c}
              aria-pressed={color === c}
              className={`w-8 h-8 rounded-full border-2 shadow-sm ${
                color === c ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'
              } transition-transform`}
              style={colorGradientStyle(c)}
            />
          ))}
        </div>
      </div>

      <div>
        <label className={label} htmlFor="med-notes">{t('medications.notes')}</label>
        <textarea
          id="med-notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      {/* Stok takibi */}
      <div className="pt-1 border-t border-gray-100 dark:border-gray-700">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 py-2">
          <input
            type="checkbox"
            checked={stockTracking}
            onChange={(e) => setStockTracking(e.target.checked)}
            className="w-4 h-4 accent-blue-500"
          />
          {t('stock.enable')}
        </label>

        {stockTracking && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={label} htmlFor="med-stock-count">{t('stock.count')}</label>
              <input
                id="med-stock-count"
                type="number"
                min={0}
                value={stockCount}
                onChange={(e) => setStockCount(Number(e.target.value))}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={label} htmlFor="med-stock-threshold">{t('stock.threshold')}</label>
              <input
                id="med-stock-threshold"
                type="number"
                min={0}
                value={stockThreshold}
                onChange={(e) => setStockThreshold(Number(e.target.value))}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        )}
      </div>

      {initial && (
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-4 h-4 accent-blue-500"
          />
          {t('medications.active')}
        </label>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={submit}
          className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm rounded-xl font-medium shadow-sm shadow-emerald-500/30"
        >
          {t('medications.save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-xl"
        >
          {t('medications.cancel')}
        </button>
      </div>
    </div>
  );
}

function RefillControl({
  medicationId,
  onRefill,
}: {
  medicationId: string;
  onRefill: (id: string, amount: number) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(30);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label={t('stock.refill')}
        title={t('stock.refill')}
        className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
      >
        <PackagePlus size={16} />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={1}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        aria-label={t('stock.refill')}
        className="w-16 px-2 py-1.5 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 outline-none"
      />
      <button
        onClick={() => {
          if (amount > 0) onRefill(medicationId, amount);
          setOpen(false);
        }}
        className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-medium"
      >
        {t('common.ok')}
      </button>
    </div>
  );
}

export default function MedicationList({
  medications,
  profileId,
  onAdd,
  onUpdate,
  onDelete,
  onRefill,
}: MedicationListProps) {
  const { t } = useTranslation();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          {t('medications.title')}
        </h1>
        {!showAdd && (
          <button
            onClick={() => {
              setShowAdd(true);
              setEditingId(null);
            }}
            className="flex items-center gap-1 min-h-[40px] px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-medium shadow-sm shadow-emerald-500/30"
          >
            <Plus size={16} />
            {t('medications.add')}
          </button>
        )}
      </div>

      {showAdd && (
        <div className="mb-3">
          <MedForm
            profileId={profileId}
            onSubmit={(med) => {
              onAdd(med);
              setShowAdd(false);
            }}
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      {medications.length === 0 && !showAdd && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-sm">
          <IconTile
            icon={Pill}
            gradient="from-emerald-500 to-teal-600"
            size={56}
            className="mx-auto mb-3"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.noMeds')}</p>
        </div>
      )}

      <ul className="space-y-2">
        {medications.map((med) => {
          const lowStock =
            med.stockTracking &&
            typeof med.stockCount === 'number' &&
            med.stockCount <= (med.stockThreshold ?? DEFAULT_STOCK_THRESHOLD);

          return editingId === med.id ? (
            <li key={med.id}>
              <MedForm
                initial={med}
                profileId={profileId}
                onSubmit={(updates) => {
                  onUpdate(med.id, updates);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={med.id}
              className={`bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm ${
                med.active ? '' : 'opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className="relative flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden"
                  style={colorGradientStyle(med.color)}
                  aria-hidden="true"
                >
                  <span className="pointer-events-none absolute inset-x-[18%] top-[12%] h-[30%] rounded-full bg-white/40 blur-[2px]" />
                  <Pill size={20} strokeWidth={2.25} className="relative text-white" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">
                    {med.name}
                  </p>
                  {med.dosage && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{med.dosage}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {med.times.map((time) => (
                      <span
                        key={time}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      >
                        {time}
                      </span>
                    ))}
                    {!med.active && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                        {t('medications.inactive')}
                      </span>
                    )}
                    {med.stockTracking && (
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full ${
                          lowStock
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {t('stock.remaining', { count: med.stockCount ?? 0 })}
                      </span>
                    )}
                  </div>
                  {med.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 whitespace-pre-wrap">
                      {med.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {med.stockTracking && (
                    <RefillControl medicationId={med.id} onRefill={onRefill} />
                  )}
                  <button
                    onClick={() => {
                      setEditingId(med.id);
                      setShowAdd(false);
                      setConfirmId(null);
                    }}
                    aria-label={t('medications.edit')}
                    title={t('medications.edit')}
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setConfirmId(med.id)}
                    aria-label={t('medications.delete')}
                    title={t('medications.delete')}
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {confirmId === med.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                    {t('medications.confirmDelete')}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onDelete(med.id);
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
    </div>
  );
}
