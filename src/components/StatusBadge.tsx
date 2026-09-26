import { useTranslation } from 'react-i18next';
import type { DoseStatus } from '../types';

const STYLES: Record<DoseStatus, string> = {
  taken: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  skipped: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  missed: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300',
  upcoming: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
};

export default function StatusBadge({ status }: { status: DoseStatus }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${STYLES[status]}`}
    >
      {t(`dashboard.${status}`)}
    </span>
  );
}
