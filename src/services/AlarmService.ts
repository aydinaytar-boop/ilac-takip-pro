// ============================================================
// AlarmService.ts — Capacitor Local Notifications ile alarm sistemi
// Dosya konumu: src/services/AlarmService.ts
//
// Web tarayıcıda (npm run dev) bu servis hiçbir şey yapmaz, sessizce
// atlanır (Capacitor.isNativePlatform() === false). Yalnızca Android/iOS
// uygulaması olarak paketlenip telefonda çalıştırıldığında etkindir.
//
// NOT: Tek bir bildirimin sesi Android'de birkaç saniyeden uzun çalmaz
// (genellikle 60 saniye sürekli çalan "gerçek alarm" sesleri için özel
// bir ses dosyası + native kod gerekir). Bunun yerine her doz saatinde
// 3 ayrı bildirim gönderiyoruz (saat, +1 dk, +2 dk) — böylece kaçırma
// ihtimali azalıyor, ısrarcı bir "dürtme" efekti oluyor.
// ============================================================

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Medication } from '../types';

const isNative = () => Capacitor.isNativePlatform();

// Adlandırılmış bildirim kanalı: kullanıcı telefon Ayarları > Uygulamalar >
// İlaç Takip Pro > Bildirimler > "İlaç Hatırlatmaları" yoluyla bu kanalın
// SESİNİ kendi telefonundaki zil seslerinden seçebilir.
const CHANNEL_ID = 'medication-reminders';

// Ana saatten sonra kaç dakika arayla ek "dürtme" bildirimi gönderilsin.
const NAG_OFFSETS_MIN = [0, 1, 2];

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

// Bildirim id'si Capacitor'da 32-bit tamsayı olmalı. İlaç id'si, saat ve
// "dürtme" sırasından deterministik bir sayı üretiyoruz; aynı kombinasyon
// için hep aynı id çıkar, böylece iptal ederken tekrar bulunabilir.
function notificationId(medicationId: string, time: string, offsetIdx: number): number {
  const str = `${medicationId}_${time}_${offsetIdx}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return (Math.abs(h) % 2147483647) || 1;
}

// "HH:MM" saatine dakika ekler, saat taşmasını (23:59 -> 00:01 gibi) sarar.
function addMinutes(time: string, minutes: number): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number);
  const total = ((h * 60 + m + minutes) % (24 * 60) + 24 * 60) % (24 * 60);
  return { hour: Math.floor(total / 60), minute: total % 60 };
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
   * Her doz saati için NAG_OFFSETS_MIN'de tanımlı sayıda bildirim kurar
   * (varsayılan: saatinde, 1 dk sonra, 2 dk sonra — 3 ayrı bildirim).
   * Önce eski alarmları iptal eder, ilaç pasifse hiç kurmaz.
   */
  static async scheduleForMedication(med: Medication): Promise<void> {
    if (!isNative()) return;
    await this.cancelForMedication(med.id);
    if (!med.active || med.times.length === 0) return;

    const granted = await this.requestPermissions();
    if (!granted) return;

    const notifications = med.times.flatMap((time) =>
      NAG_OFFSETS_MIN.map((offsetMin, idx) => {
        const { hour, minute } = addMinutes(time, offsetMin);
        const isFirst = idx === 0;
        return {
          id: notificationId(med.id, time, idx),
          channelId: CHANNEL_ID,
          title: isFirst ? '💊 İlaç Zamanı' : '💊 İlaç Zamanı — Hatırlatma',
          body: med.dosage ? `${med.name} — ${med.dosage}` : med.name,
          sound: 'default',
          schedule: {
            on: { hour, minute },
            repeats: true,
            allowWhileIdle: true,
          },
          extra: { medicationId: med.id, scheduledTime: time },
        };
      })
    );

    try {
      await LocalNotifications.schedule({ notifications });
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
