import { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import type { WishlistItem, WishlistPriority } from '../types';

type WishlistCardProps = {
  item: WishlistItem;
  onDelete?: (id: string) => void;
  onEdit?: (item: WishlistItem) => void;
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

export function WishlistCard({ item, onDelete, onEdit }: WishlistCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const meta = priorityMeta[item.priority];

  return (
    <Card className="space-y-3 overflow-hidden border border-rose-100/80 bg-gradient-to-b from-rose-50/60 to-white">
      <div className="flex items-start justify-between gap-3">
        <h3
          className={`min-w-0 text-base font-semibold text-slate-900 sm:text-lg ${
            isExpanded ? 'break-words' : 'overflow-hidden text-ellipsis whitespace-nowrap'
          }`}
        >
          {item.title}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}
        >
          {meta.label}
        </span>
      </div>

      <p
        className={`min-w-0 text-sm leading-relaxed text-slate-600 ${
          isExpanded
            ? 'break-words'
            : 'overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]'
        }`}
      >
        {item.description}
      </p>

      <div className="space-y-2">
        <span
          className={`block text-base font-semibold text-slate-900 ${
            isExpanded ? 'break-words' : 'overflow-hidden text-ellipsis whitespace-nowrap'
          }`}
        >
          {item.price}
        </span>

        {isExpanded ? (
          <a
            className="block break-all text-sm font-medium text-indigo-600 underline-offset-2 transition hover:text-indigo-500 hover:underline"
            href={item.link}
            target="_blank"
            rel="noreferrer"
          >
            {item.link}
          </a>
        ) : (
          <p className="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-slate-500">
            {item.link}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-sm font-medium text-indigo-600 underline-offset-2 transition hover:text-indigo-500 hover:underline"
        >
          {isExpanded ? 'Скрыть' : 'Открыть'}
        </button>

        <div className="flex items-center gap-2">
          {onEdit ? (
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="rounded-md border border-rose-200 px-2.5 py-1 text-sm text-rose-700 transition hover:bg-rose-50 hover:text-rose-800"
            >
              Редактировать
            </button>
          ) : null}

          {onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="rounded-md border border-slate-200 px-2.5 py-1 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
            >
              Удалить
            </button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
