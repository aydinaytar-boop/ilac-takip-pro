import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { useThemeStore } from '../store/useThemeStore';
import { useProfileStore } from '../store/useProfileStore';
import { SUPPORTED_LANGUAGES } from '../i18n';
import { PROFILE_EMOJIS } from '../types';
import { AlarmService } from '../services/AlarmService';
import IconTile from './IconTile';
import { Sun, Moon, Monitor, Bell, Globe, Users, Plus, Trash2, Check, BellRing } from 'lucide-react';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useThemeStore();
  const { profiles, activeProfileId, addProfile, deleteProfile, setActiveProfile } = useProfileStore();
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('👤');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const isRTL = i18n.dir() === 'rtl';
  const isNative = Capacitor.isNativePlatform();
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  useEffect(() => {
    if (isNative) {
      AlarmService.hasPermission().then(setPermissionGranted);
    }
  }, [isNative]);

  const handleAddProfile = () => {
    if (!newName.trim()) return;
    addProfile(newName.trim(), newEmoji);
    setNewName('');
    setNewEmoji('👤');
    setShowAddProfile(false);
  };

  const requestNotificationPermission = async () => {
    const granted = await AlarmService.requestPermissions();
    setPermissionGranted(granted);
  };

  const Section = ({ icon: Icon, title, children, gradient }: any) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm">
      <div className={`flex items-center gap-2.5 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <IconTile icon={Icon} gradient={gradient} size={30} />
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );

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
              <div
                className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
                  activeProfileId === profile.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                    : 'bg-gray-50 dark:bg-gray-700'
                } ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <span className="text-xl">{profile.emoji}</span>
                <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">{profile.name}</span>
                {activeProfileId === profile.id && (
                  <Check size={14} className="text-blue-500" />
                )}
                {activeProfileId !== profile.id && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setActiveProfile(profile.id)}
                      className="text-xs bg-blue-500 text-white px-2 py-1 rounded-lg"
                    >
                      {t('profile.select')}
                    </button>
                    {profile.id !== 'default' && (
                      <button
                        onClick={() => setConfirmDeleteId(profile.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                        aria-label={t('medications.delete')}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
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
            </div>
          ))}
        </div>

        {showAddProfile ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {PROFILE_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setNewEmoji(e)}
                  className={`text-xl p-1 rounded-lg ${newEmoji === e ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('profile.name')}
              className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddProfile}
                className="flex-1 py-2 bg-blue-500 text-white text-sm rounded-xl font-medium"
              >
                {t('common.ok')}
              </button>
              <button
                onClick={() => setShowAddProfile(false)}
                className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-xl"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddProfile(true)}
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
        <p>v2.0.0 · 11 dil · Web + Mobile</p>
      </div>
    </div>
  );
}
