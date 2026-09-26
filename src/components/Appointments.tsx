import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Calendar as CalendarIcon, Clock, CalendarDays } from 'lucide-react';
import type { Appointment } from '../types/appointment';
import { daysUntil, toDateStr } from '../utils/date';
import IconTile from './IconTile';

type AppointmentInput = Omit<Appointment, 'id' | 'createdAt'>;

interface AppointmentsProps {
  appointments: Appointment[];
  profileId: string;
  onAdd: (a: AppointmentInput) => void;
  onUpdate: (id: string, updates: Partial<Appointment>) => void;
  onDelete: (id: string) => void;
}

const INPUT_CLASS =
  'w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 outline-none focus:border-blue-400';

function AppointmentForm({
  initial,
  profileId,
  onSubmit,
  onCancel,
}: {
  initial?: Appointment;
  profileId: string;
  onSubmit: (a: AppointmentInput) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [doctorName, setDoctorName] = useState(initial?.doctorName ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [date, setDate] = useState(initial?.date ?? toDateStr());
  const [time, setTime] = useState(initial?.time ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [invalid, setInvalid] = useState(false);

  const submit = () => {
    if (!title.trim() || !date) {
      setInvalid(true);
      return;
    }
    onSubmit({
      profileId,
      title: title.trim(),
      doctorName: doctorName.trim() || undefined,
      location: location.trim() || undefined,
      date,
      time: time || undefined,
      note: note.trim() || undefined,
    });
  };

  const label = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2.5">
        <IconTile icon={CalendarDays} gradient="from-amber-500 to-orange-600" size={30} />
        <h2 className="font-semibold text-sm text-gray-800 dark:text-gray-100">
          {initial ? t('medications.edit') : t('appointments.add')}
        </h2>
      </div>
      <div>
        <label className={label} htmlFor="appt-title">{t('appointments.title')}</label>
        <input
          id="appt-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={invalid && !title.trim()}
          className={`${INPUT_CLASS} ${invalid && !title.trim() ? 'border-red-400 dark:border-red-500' : ''}`}
        />
      </div>
      <div>
        <label className={label} htmlFor="appt-doctor">{t('appointments.doctor')}</label>
        <input
          id="appt-doctor"
          type="text"
          value={doctorName}
          onChange={(e) => setDoctorName(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>
      <div>
        <label className={label} htmlFor="appt-location">{t('appointments.location')}</label>
        <input
          id="appt-location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={label} htmlFor="appt-date">{t('appointments.date')}</label>
          <input
            id="appt-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={invalid && !date}
            className={`${INPUT_CLASS} ${invalid && !date ? 'border-red-400 dark:border-red-500' : ''}`}
          />
        </div>
        <div>
          <label className={label} htmlFor="appt-time">{t('appointments.time')}</label>
          <input
            id="appt-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      </div>
      <div>
        <label className={label} htmlFor="appt-note">{t('common.note')}</label>
        <textarea
          id="appt-note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={submit}
          className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm rounded-xl font-medium shadow-sm shadow-amber-500/30"
        >
          {t('medications.save')}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-xl"
        >
          {t('medications.cancel')}
        </button>
      </div>
    </div>
  );
}

export default function Appointments({
  appointments,
  profileId,
  onAdd,
  onUpdate,
  onDelete,
}: AppointmentsProps) {
  const { t, i18n } = useTranslation();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const todayStr = toDateStr();
  const upcoming = appointments.filter((a) => a.date >= todayStr);
  const past = appointments
    .filter((a) => a.date < todayStr)
    .slice()
    .reverse();

  const formatDate = (date: string) =>
    new Date(date + 'T00:00:00').toLocaleDateString(i18n.language, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const daysLabel = (date: string) => {
    const n = daysUntil(date);
    if (n === 0) return t('time.today');
    if (n < 0) return null;
    return t('appointments.daysLeft', { count: n });
  };

  const card = (a: Appointment, isPast: boolean) => (
    <li key={a.id} className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm">
      {editingId === a.id ? (
        <AppointmentForm
          initial={a}
          profileId={profileId}
          onSubmit={(updates) => {
            onUpdate(a.id, updates);
            setEditingId(null);
          }}
          onCancel={() => setEditingId(null)}
        />
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">
                {a.title}
              </p>
              {a.doctorName && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  👨‍⚕️ {a.doctorName}
                </p>
              )}
              {a.location && (
                <p className="text-xs text-gray-500 dark:text-gray-400">🏥 {a.location}</p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 flex items-center gap-1 justify-end">
                <CalendarIcon size={13} className="text-gray-400" />
                {formatDate(a.date)}
              </p>
              {a.time && (
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 justify-end mt-0.5">
                  <Clock size={12} />
                  {a.time}
                </p>
              )}
              {!isPast && daysLabel(a.date) && (
                <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                  {daysLabel(a.date)}
                </span>
              )}
            </div>
          </div>

          {a.note && (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1.5">📝 {a.note}</p>
          )}

          <div className="flex gap-2 mt-2.5">
            <button
              onClick={() => {
                setEditingId(a.id);
                setShowAdd(false);
              }}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium"
            >
              <Pencil size={13} />
              {t('medications.edit')}
            </button>
            <button
              onClick={() => setConfirmId(a.id)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium"
            >
              <Trash2 size={13} />
              {t('medications.delete')}
            </button>
          </div>

          {confirmId === a.id && (
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                {t('appointments.confirmDelete')}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onDelete(a.id);
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
        </>
      )}
    </li>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          {t('appointments.pageTitle')}
        </h1>
        {!showAdd && (
          <button
            onClick={() => {
              setShowAdd(true);
              setEditingId(null);
            }}
            className="flex items-center gap-1 min-h-[40px] px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm font-medium shadow-sm shadow-amber-500/30"
          >
            <Plus size={16} />
            {t('appointments.add')}
          </button>
        )}
      </div>

      {showAdd && (
        <AppointmentForm
          profileId={profileId}
          onSubmit={(a) => {
            onAdd(a);
            setShowAdd(false);
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <h2 className="text-xs font-semibold tracking-wide text-gray-400 dark:text-gray-500 mb-2 uppercase">
        {t('appointments.upcoming', { count: upcoming.length })}
      </h2>
      {upcoming.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-sm mb-4">
          <IconTile
            icon={CalendarDays}
            gradient="from-amber-500 to-orange-600"
            size={48}
            className="mx-auto mb-2"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('appointments.noUpcoming')}</p>
        </div>
      ) : (
        <ul className="space-y-2 mb-4">{upcoming.map((a) => card(a, false))}</ul>
      )}

      {past.length > 0 && (
        <>
          <h2 className="text-xs font-semibold tracking-wide text-gray-400 dark:text-gray-500 mb-2 uppercase">
            {t('appointments.past', { count: past.length })}
          </h2>
          <ul className="space-y-2">{past.map((a) => card(a, true))}</ul>
        </>
      )}
    </div>
  );
}
