import { Card } from '../../../components/ui/Card';
import type { WishlistItem, WishlistPriority } from '../types';

type WishlistCardProps = {
  item: WishlistItem;
};

const priorityMeta: Record<WishlistPriority, { label: string; className: string }> = {
  nice: {
    label: 'Можно',
    className: 'bg-emerald-100 text-emerald-700',
  },
  love: {
    label: 'Очень хочу',
    className: 'bg-rose-100 text-rose-700',
  },
  urgent: {
    label: 'Срочно хочу',
    className: 'bg-amber-100 text-amber-800',
  },
  cute: {
    label: 'Милая мелочь',
    className: 'bg-violet-100 text-violet-700',
  },
};

export function WishlistCard({ item }: WishlistCardProps) {
  const meta = priorityMeta[item.priority];

  return (
    <Card className="space-y-3 border border-rose-100/80 bg-gradient-to-b from-rose-50/50 to-white">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}
        >
          {meta.label}
        </span>
      </div>

      <p className="text-sm text-slate-600">{item.description}</p>

      <div className="flex items-center justify-between gap-3">
        <span className="text-base font-semibold text-slate-900">{item.price}</span>
        <a
          className="text-sm font-medium text-indigo-600 underline-offset-2 transition hover:text-indigo-500 hover:underline"
          href={item.link}
          target="_blank"
          rel="noreferrer"
        >
          Открыть
        </a>
      </div>
    </Card>
  );
}
