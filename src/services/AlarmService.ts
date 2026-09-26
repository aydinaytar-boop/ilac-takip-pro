// ============================================================
// AlarmService.ts — Capacitor Local Notifications ile alarm sistemi
// Dosya konumu: src/services/AlarmService.ts
//
// Web tarayıcıda (npm run dev) bu servis hiçbir şey yapmaz, sessizce
// atlanır (Capacitor.isNativePlatform() === false). Yalnızca Android/iOS
// uygulaması olarak paketlenip telefonda çalıştırıldığında etkindir.
// ============================================================

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Medication } from '../types';

const isNative = () => Capacitor.isNativePlatform();

// Adlandırılmış bildirim kanalı: kullanıcı telefon Ayarları > Uygulamalar >
// İlaç Takip Pro > Bildirimler > "İlaç Hatırlatmaları" yoluyla bu kanalın
// SESİNİ kendi telefonundaki zil seslerinden seçebilir — kod değişikliği
// ya da yeni APK gerekmez.
const CHANNEL_ID = 'medication-reminders';

let channelReady: Promise<void> | null = null;

async function ensureChannel(): Promise<void> {
  if (!isNative()) return;
  if (!channelReady) {
    channelReady = LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'İlaç Hatırlatmaları',
      description: 'İlaç alma zamanı geldiğinde gelen hatırlatmalar',
      importance: 5, // IMPORTANCE_HIGH: ekranın üstünde açılır, ses çalar
      visibility: 1, // ekranın kilitli halinde de içerik görünsün
      sound: 'default',
      vibration: true,
    }).catch((e) => console.warn('AlarmService.ensureChannel failed', e));
  }
  await channelReady;
}

// Bildirim id'si Capacitor'da 32-bit tamsayı olmalı. İlaç id'si (string)
// ve saatten deterministik bir sayı üretiyoruz; aynı ilaç+saat için hep
// aynı id çıkar, böylece iptal ederken tekrar bulunabilir.
function notificationId(medicationId: string, time: string): number {
  const str = `${medicationId}_${time}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return (Math.abs(h) % 2147483647) || 1;
}

export class AlarmService {
  /** Bildirim izni iste. Web'de her zaman false döner. */
  static async requestPermissions(): Promise<boolean> {
    if (!isNative()) return false;
    try {
      await ensureChannel();
      const current = await LocalNotifications.checkPermissions();
      if (current.display === 'granted') return true;
      const requested = await LocalNotifications.requestPermissions();
      return requested.display === 'granted';
    } catch (e) {
      console.warn('AlarmService.requestPermissions failed', e);
      return false;
    }
  }

  static async hasPermission(): Promise<boolean> {
    if (!isNative()) return false;
    try {
      const current = await LocalNotifications.checkPermissions();
      return current.display === 'granted';
    } catch {
      return false;
    }
  }

  /** Bir ilacın önceki tüm alarmlarını iptal eder (extra.medicationId ile eşleştirerek). */
  static async cancelForMedication(medicationId: string): Promise<void> {
    if (!isNative()) return;
    try {
      const pending = await LocalNotifications.getPending();
      const toCancel = pending.notifications.filter(
        (n) => n.extra?.medicationId === medicationId
      );
      if (toCancel.length > 0) {
        await LocalNotifications.cancel({
          notifications: toCancel.map((n) => ({ id: n.id })),
        });
      }
    } catch (e) {
      console.warn('AlarmService.cancelForMedication failed', e);
    }
  }

  /**
   * Bir ilaç için günlük tekrar eden alarmları kurar.
   * Önce eski alarmları iptal eder, ilaç pasifse hiç kurmaz.
   */
  static async scheduleForMedication(med: Medication): Promise<void> {
    if (!isNative()) return;
    await this.cancelForMedication(med.id);
    if (!med.active || med.times.length === 0) return;

    const granted = await this.requestPermissions();
    if (!granted) return;

    try {
      await LocalNotifications.schedule({
        notifications: med.times.map((time) => {
          const [hour, minute] = time.split(':').map(Number);
          return {
            id: notificationId(med.id, time),
            channelId: CHANNEL_ID,
            title: '💊 İlaç Zamanı',
            body: med.dosage ? `${med.name} — ${med.dosage}` : med.name,
            sound: 'default',
            schedule: {
              on: { hour, minute },
              repeats: true,
              allowWhileIdle: true,
            },
            extra: { medicationId: med.id, scheduledTime: time },
          };
        }),
      });
    } catch (e) {
      console.warn('AlarmService.scheduleForMedication failed', e);
    }
  }

  /** Uygulama açılışında ya da profil değişince tüm aktif ilaçları yeniden planlar. */
  static async rescheduleAll(medications: Medication[]): Promise<void> {
    if (!isNative()) return;
    await ensureChannel();
    for (const med of medications) {
      if (med.active) await this.scheduleForMedication(med);
      else await this.cancelForMedication(med.id);
    }
  }

  static async cancelAll(): Promise<void> {
    if (!isNative()) return;
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({
          notifications: pending.notifications.map((n) => ({ id: n.id })),
        });
      }
    } catch (e) {
      console.warn('AlarmService.cancelAll failed', e);
    }
  }
}
