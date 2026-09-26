import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useMedStore } from './store/useMedStore';
import { useThemeStore } from './store/useThemeStore';
import { useProfileStore } from './store/useProfileStore';
import { useVitalsStore } from './store/useVitalsStore';
import { useAppointmentStore } from './store/useAppointmentStore';
import { AlarmService } from './services/AlarmService';

import Dashboard from './components/Dashboard';
import MedicationList from './components/MedicationList';
import History from './components/History';
import Stats from './components/Stats';
import Health from './components/Health';
import Appointments from './components/Appointments';
import Notes from './components/Notes';
import Settings from './components/Settings';
import IconTile from './components/IconTile';

import {
  LayoutDashboard, Pill, History as HistoryIcon,
  BarChart2, BookOpen, SettingsIcon, HeartPulse, CalendarDays
} from 'lucide-react';
import type { AppView } from './types';

const NAV_ITEMS: { view: AppView; labelKey: string; icon: typeof LayoutDashboard; gradient: string }[] = [
  { view: 'dashboard',    labelKey: 'nav.today',       icon: LayoutDashboard, gradient: 'from-blue-500 to-indigo-600' },
  { view: 'medications',  labelKey: 'nav.medications',  icon: Pill,            gradient: 'from-emerald-500 to-teal-600' },
  { view: 'health',       labelKey: 'nav.health',       icon: HeartPulse,      gradient: 'from-rose-500 to-pink-600' },
  { view: 'appointments', labelKey: 'nav.appointments', icon: CalendarDays,    gradient: 'from-amber-500 to-orange-600' },
  { view: 'history',      labelKey: 'nav.history',      icon: HistoryIcon,     gradient: 'from-cyan-500 to-sky-600' },
  { view: 'stats',        labelKey: 'nav.stats',        icon: BarChart2,       gradient: 'from-violet-500 to-purple-600' },
  { view: 'notes',        labelKey: 'nav.notes',        icon: BookOpen,        gradient: 'from-fuchsia-500 to-pink-600' },
  { view: 'settings',    labelKey: 'settings.title',   icon: SettingsIcon,    gradient: 'from-slate-500 to-gray-600' },
];

export default function App() {
  const { t, i18n } = useTranslation();
  const store = useMedStore();
  const vitals = useVitalsStore();
  const appts = useAppointmentStore();
  const { applyTheme } = useThemeStore();
  const { activeProfileId, activeProfile } = useProfileStore();
  const profile = activeProfile();

  useEffect(() => {
    applyTheme();
    document.documentElement.dir = i18n.dir();
    document.documentElement.lang = i18n.language;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', applyTheme);
    return () => mq.removeEventListener('change', applyTheme);
  }, [i18n.language]);

  useEffect(() => {
    const meds = store.getMedicationsForProfile(activeProfileId);
    void AlarmService.rescheduleAll(meds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfileId]);

  const rate = store.adherenceRate(activeProfileId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 transition-colors">
      {/* Top Bar */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 sticky top-0 z-40 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <IconTile icon={Pill} gradient="from-blue-500 via-indigo-500 to-violet-600" size={34} />
            <div>
              <h1 className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-none">
                {t('app.name')}
              </h1>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-none mt-0.5">
                {t('app.tagline')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile && (
              <button
                className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-full"
                onClick={() => store.setView('settings')}
              >
                <span className="text-sm">{profile.emoji}</span>
                <span className="text-xs text-gray-600 dark:text-gray-300 font-medium max-w-16 truncate">
                  {profile.name}
                </span>
              </button>
            )}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm shadow-blue-500/30">
              {t('app.adherence', { rate })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6 pb-28">
        {store.view === 'dashboard' && (
          <Dashboard
            todayLogs={store.todayLogs(activeProfileId)}
            medications={store.getMedicationsForProfile(activeProfileId)}
            adherenceRate={rate}
            onTake={store.takeDose}
            onSkip={store.skipDose}
            onUndo={store.undoDose}
          />
        )}
        {store.view === 'medications' && (
          <MedicationList
            medications={store.medications.filter(m => m.profileId === activeProfileId)}
            profileId={activeProfileId}
            onAdd={store.addMedication}
            onUpdate={store.updateMedication}
            onDelete={store.deleteMedication}
            onRefill={store.refillMedication}
          />
        )}
        {store.view === 'health' && (
          <Health
            bpReadings={vitals.bpReadingsForProfile(activeProfileId)}
            onAddBP={(s, d, p, n) => vitals.addBPReading(activeProfileId, s, d, p, n)}
            onDeleteBP={vitals.deleteBPReading}
            glucoseReadings={vitals.glucoseReadingsForProfile(activeProfileId)}
            onAddGlucose={(v, c, n) => vitals.addGlucoseReading(activeProfileId, v, c, n)}
            onDeleteGlucose={vitals.deleteGlucoseReading}
          />
        )}
        {store.view === 'appointments' && (
          <Appointments
            appointments={appts.appointmentsForProfile(activeProfileId)}
            profileId={activeProfileId}
            onAdd={appts.addAppointment}
            onUpdate={appts.updateAppointment}
            onDelete={appts.deleteAppointment}
          />
        )}
        {store.view === 'history' && (
          <History
            doseLogs={store.doseLogs.filter(l => l.profileId === activeProfileId)}
            medications={store.medications.filter(m => m.profileId === activeProfileId)}
            selectedDate={store.selectedDate}
            onDateChange={store.setSelectedDate}
          />
        )}
        {store.view === 'stats' && (
          <Stats
            doseLogs={store.doseLogs.filter(l => l.profileId === activeProfileId)}
            medications={store.medications.filter(m => m.profileId === activeProfileId)}
          />
        )}
        {store.view === 'notes' && (
          <Notes
            notes={store.healthNotes.filter(n => n.profileId === activeProfileId)}
            onAdd={(content) => store.addNote(activeProfileId, content)}
            onDelete={store.deleteNote}
          />
        )}
        {store.view === 'settings' && <Settings />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/85 dark:bg-gray-800/85 backdrop-blur-md border-t border-gray-100 dark:border-gray-700 shadow-2xl z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-lg mx-auto px-1 py-2 flex items-center gap-0.5 overflow-x-auto">
          {NAV_ITEMS.map(({ view, labelKey, icon: Icon, gradient }) => {
            const isActive = store.view === view;
            return (
              <button
                key={view}
                onClick={() => store.setView(view)}
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-2xl transition-all flex-shrink-0"
              >
                {isActive ? (
                  <IconTile icon={Icon} gradient={gradient} size={32} className="-translate-y-0.5" />
                ) : (
                  <IconTile icon={Icon} gradient={gradient} size={28} muted />
                )}
                <span
                  className={`text-[10px] font-medium leading-none whitespace-nowrap ${
                    isActive ? 'text-gray-800 dark:text-gray-100 font-semibold' : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {t(labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

