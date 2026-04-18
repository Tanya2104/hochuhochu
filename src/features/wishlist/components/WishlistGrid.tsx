import { Container } from '../../../components/ui/Container';
import { SectionTitle } from '../../../components/ui/SectionTitle';
import type { WishlistItem } from '../types';
import { WishlistCard } from './WishlistCard';

type WishlistGridProps = {
  items: WishlistItem[];
  onDelete?: (id: string) => void;
  onEdit?: (item: WishlistItem) => void;
  isReadOnly?: boolean;
};

export function WishlistGrid({ items, onDelete, onEdit, isReadOnly = false }: WishlistGridProps) {
  const sectionTitle = isReadOnly ? 'Идеи для подарка' : 'ХочуХочу список';
  const sectionSubtitle = isReadOnly
    ? 'Открой карточку, чтобы посмотреть детали'
    : 'Добавляй свои желания и делись ими';

  return (
    <Container className="py-8 sm:py-10">
      <SectionTitle title={sectionTitle} subtitle={sectionSubtitle} />

      {items.length === 0 ? (
        <p
          className={`rounded-2xl p-6 text-sm shadow-sm sm:text-base ${
            isReadOnly
              ? 'border border-dashed border-rose-200 bg-white/80 text-center text-slate-500'
              : 'border border-rose-100 bg-white/90 text-slate-500'
          }`}
        >
          {isReadOnly ? 'Ксюша пока ничего не добавила' : 'Пока тут пусто — самое время добавить первую хотелку'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <WishlistCard
              key={item.id}
              item={item}
              onDelete={onDelete}
              onEdit={onEdit}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      )}
    </Container>
  );
}
