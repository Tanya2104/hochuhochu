import { Card } from '../../../components/ui/Card';
import type { WishlistItem, WishlistPriority } from '../types';

type WishlistCardProps = {
  item: WishlistItem;
};

const priorityLabels: Record<WishlistPriority, string> = {
  nice: 'Можно',
  love: 'Очень хочу',
  urgent: 'Срочно хочу',
  cute: 'Милая мелочь',
};

export function WishlistCard({ item }: WishlistCardProps) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
          {priorityLabels[item.priority]}
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
