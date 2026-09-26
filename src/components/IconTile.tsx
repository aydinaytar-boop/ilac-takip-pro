import type { LucideIcon } from 'lucide-react';

interface IconTileProps {
  icon: LucideIcon;
  /** Tailwind gradient stop classes, örn. "from-blue-500 to-indigo-600" */
  gradient: string;
  /** Rozetin kare boyutu (px). İkon boyutu bunun ~55%'i olur. */
  size?: number;
  className?: string;
  /**
   * true ise rozet soluk/pastel görünür (ör. pasif sekme ikonları).
   * Yine de düz bir çizgi ikondan farklı, hafif gradyanlı ve yuvarlak kalır.
   */
  muted?: boolean;
}

/**
 * 2025-2026 arayüzlerinde yaygınlaşan "yumuşak 3D / clay" ikon rozeti:
 * gradyanlı yüzey + üstte camsı bir parlama şeridi + yumuşak gölge.
 * Düz tek renkli ikonlara göre daha dokunsal/canlı bir his verir.
 */
export default function IconTile({ icon: Icon, gradient, size = 40, className = '', muted = false }: IconTileProps) {
  return (
    <span
      className={`relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} overflow-hidden flex-shrink-0 ${
        muted
          ? 'opacity-60 dark:opacity-50 shadow-sm shadow-black/10'
          : 'shadow-lg shadow-black/20'
      } ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* camsı üst parlama */}
      <span className="pointer-events-none absolute inset-x-[15%] top-[10%] h-[35%] rounded-full bg-white/40 blur-[3px]" />
      {/* alt kısımda hafif koyulaşma (derinlik) */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/15 to-transparent" />
      <Icon size={Math.round(size * 0.52)} strokeWidth={2.25} className="relative text-white drop-shadow-sm" />
    </span>
  );
}
