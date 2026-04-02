import { Container } from '../../../components/ui/Container';
import { SectionTitle } from '../../../components/ui/SectionTitle';
import { WishlistCard } from './WishlistCard';
import type { WishlistItem } from '../types';

type WishlistGridProps = {
  items: WishlistItem[];
};

export function WishlistGrid({ items }: WishlistGridProps) {
  return (
    <Container className="py-8 sm:py-10">
      <SectionTitle
        title="ХочуХочу список"
        subtitle="Добавляй свои желания и делись ими"
      />

      {items.length === 0 ? (
        <p className="rounded-2xl bg-white/80 p-6 text-sm text-slate-500 shadow-sm sm:text-base">
          Пока тут пусто — самое время добавить первую хотелку
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <WishlistCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </Container>
  );
}
