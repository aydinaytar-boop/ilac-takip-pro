import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { useThemeStore } from '../store/useThemeStore';
import { useProfileStore } from '../store/useProfileStore';
import type { Profile } from '../store/useProfileStore';
import { SUPPORTED_LANGUAGES } from '../i18n';
import { PROFILE_EMOJIS } from '../types';
import { AlarmService } from '../services/AlarmService';
import IconTile from './IconTile';
import {
  Sun, Moon, Monitor, Bell, Globe, Users, Plus, Trash2, Check, BellRing, Pencil,
} from 'lucide-react';

const INPUT_CLASS =
  'w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 outline-none focus:border-blue-400';

// Bileşen bilerek Settings'in DIŞINDA tanımlı: Settings her yeniden çizildiğinde
// (örn. tema değişince) bu bileşen yeniden YARATILMASIN diye. İçeride tanımlansaydı
// her tuş vuruşunda React bunu "yeni bir bileşen" sanıp içindeki inputları
// sıfırlıyor, bu da odağın (focus) kaybolmasına yol açıyordu.
function Section({
  icon: Icon,
  title,
  children,
  gradient,
}: {
  icon: any;
  title: string;
  children: any;
  gradient: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm">
      <div className="flex items-center gap-2.5 mb-3">
        <IconTile icon={Icon} gradient={gradient} size={30} />
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// Aynı sebeple: profil ekleme/düzenleme formu da dışarıda tanımlı.
function ProfileForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Profile;
  onSubmit: (input: Omit<Profile, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial?.name ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '👤');
  const [dob, setDob] = useState(initial?.dateOfBirth ?? '');
  const [doctorName, setDoctorName] = useState(initial?.doctorName ?? '');
  const [doctorPhone, setDoctorPhone] = useState(initial?.doctorPhone ?? '');
  const [height, setHeight] = useState(initial?.heightCm?.toString() ?? '');
  const [weight, setWeight] = useState(initial?.weightKg?.toString() ?? '');

  const submit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      emoji,
      dateOfBirth: dob || undefined,
      doctorName: doctorName.trim() || undefined,
      doctorPhone: doctorPhone.trim() || undefined,
      heightCm: height ? Number(height) : undefined,
      weightKg: weight ? Number(weight) : undefined,
    });
  };

  const label = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1';

  return (
    <div className="space-y-2 bg-gray-50 dark:bg-gray-900/40 rounded-xl p-3">
      <div className="flex flex-wrap gap-1">
        {PROFILE_EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setEmoji(e)}
            className={`text-xl p-1 rounded-lg ${emoji === e ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}
          >
            {e}
          </button>
        ))}
      </div>

      <div>
        <label className={label} htmlFor="profile-name">{t('profile.name')}</label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label className={label} htmlFor="profile-dob">{t('profile.dob')}</label>
        <input
          id="profile-dob"
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={label} htmlFor="profile-height">{t('profile.height')}</label>
          <input
            id="profile-height"
            type="number"
            inputMode="numeric"
            min={0}
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={label} htmlFor="profile-weight">{t('profile.weight')}</label>
          <input
            id="profile-weight"
            type="number"
            inputMode="numeric"
            min={0}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="profile-doctor-name">{t('profile.doctorName')}</label>
        <input
          id="profile-doctor-name"
          type="text"
          value={doctorName}
          onChange={(e) => setDoctorName(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label className={label} htmlFor="profile-doctor-phone">{t('profile.doctorPhone')}</label>
        <input
          id="profile-doctor-phone"
          type="tel"
          value={doctorPhone}
          onChange={(e) => setDoctorPhone(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={submit}
          className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-xl font-medium"
        >
          {t('common.ok')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-xl"
        >
          {t('common.close')}
        </button>
      </div>
    </div>
  );
}

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useThemeStore();
  const { profiles, activeProfileId, addProfile, updateProfile, deleteProfile, setActiveProfile } =
    useProfileStore();
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const isNative = Capacitor.isNativePlatform();
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  useEffect(() => {
    if (isNative) {
      AlarmService.hasPermission().then(setPermissionGranted);
    }
  }, [isNative]);

  const requestNotificationPermission = async () => {
    const granted = await AlarmService.requestPermissions();
    setPermissionGranted(granted);
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('settings.title')}</h1>

      {/* Language */}
      <Section icon={Globe} title={t('settings.language')} gradient="from-sky-500 to-blue-600">
        <div className="grid grid-cols-2 gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                i18n.changeLanguage(lang.code);
                document.documentElement.dir = lang.dir;
                document.documentElement.lang = lang.code;
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                i18n.language === lang.code
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <span>{lang.flag}</span>
              <span className="truncate">{lang.name}</span>
              {i18n.language === lang.code && <Check size={13} className="ml-auto flex-shrink-0" />}
            </button>
          ))}
        </div>
      </Section>

      {/* Theme */}
      <Section icon={Sun} title={t('settings.theme')} gradient="from-amber-400 to-orange-500">
        <div className="flex gap-2">
          {([
            { key: 'light', icon: Sun, label: t('settings.themeLight') },
            { key: 'dark', icon: Moon, label: t('settings.themeDark') },
            { key: 'system', icon: Monitor, label: t('settings.themeSystem') },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium transition-all ${
                theme === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </Section>

      {/* Profiles */}
      <Section icon={Users} title={t('profile.title')} gradient="from-emerald-500 to-teal-600">
        <div className="space-y-2 mb-3">
          {profiles.map((profile) => (
            <div key={profile.id}>
              {editingProfileId === profile.id ? (
                <ProfileForm
                  initial={profile}
                  onSubmit={(input) => {
                    updateProfile(profile.id, input);
                    setEditingProfileId(null);
                  }}
                  onCancel={() => setEditingProfileId(null)}
                />
              ) : (
                <>
                  <div
                    className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
                      activeProfileId === profile.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                        : 'bg-gray-50 dark:bg-gray-700'
                    }`}
                  >
                    <span className="text-xl">{profile.emoji}</span>
                    <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
                      {profile.name}
                    </span>
                    {activeProfileId === profile.id && <Check size={14} className="text-blue-500" />}
                    {activeProfileId !== profile.id && (
                      <button
                        onClick={() => setActiveProfile(profile.id)}
                        className="text-xs bg-blue-500 text-white px-2 py-1 rounded-lg"
                      >
                        {t('profile.select')}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingProfileId(profile.id);
                        setShowAddProfile(false);
                      }}
                      aria-label={t('medications.edit')}
                      className="text-gray-400 hover:text-blue-500 p-1"
                    >
                      <Pencil size={13} />
                    </button>
                    {profile.id !== 'default' && (
                      <button
                        onClick={() => setConfirmDeleteId(profile.id)}
                        aria-label={t('medications.delete')}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {confirmDeleteId === profile.id && (
                    <div className="mt-1.5 p-2 rounded-xl bg-red-50 dark:bg-red-900/20">
                      <p className="text-xs text-gray-700 dark:text-gray-200 mb-2">
                        {t('medications.confirmDelete')}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            deleteProfile(profile.id);
                            setConfirmDeleteId(null);
                          }}
                          className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg font-medium"
                        >
                          {t('common.yes')}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="flex-1 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-lg"
                        >
                          {t('common.no')}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {showAddProfile ? (
          <ProfileForm
            onSubmit={(input) => {
              addProfile(input);
              setShowAddProfile(false);
            }}
            onCancel={() => setShowAddProfile(false)}
          />
        ) : (
          <button
            onClick={() => {
              setShowAddProfile(true);
              setEditingProfileId(null);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-all"
          >
            <Plus size={15} />
            {t('profile.add')}
          </button>
        )}
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title={t('settings.notifications')} gradient="from-rose-500 to-pink-600">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t('settings.notificationsDesc')}</p>

        {!isNative ? (
          <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
            {t('settings.notificationsWebOnly')}
          </div>
        ) : permissionGranted ? (
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
            <Check size={15} />
            {t('settings.notificationsGranted')}
          </div>
        ) : (
          <button
            onClick={requestNotificationPermission}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-xl font-medium"
          >
            <BellRing size={16} />
            {t('settings.notificationsEnable')}
          </button>
        )}
      </Section>

      {/* About */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4 pb-2">
        <p className="font-semibold text-gray-600 dark:text-gray-300">İlaç Takip Pro</p>
        <p>v2.1.0 · 11 dil · Web + Mobile</p>
      </div>
    </div>
  );
}
