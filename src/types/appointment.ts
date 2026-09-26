export interface Appointment {
  id: string;
  profileId: string;
  title: string;        // Uzmanlık/branş, örn. "Nöroloji"
  doctorName?: string;
  location?: string;    // örn. "Özel", "Devlet Hastanesi"
  date: string;         // YYYY-MM-DD (yerel)
  time?: string;        // HH:MM
  note?: string;
  createdAt: string;
}
