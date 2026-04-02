import { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { AppHeader } from '../components/layout/AppHeader';
import { ProfileHero } from '../features/profile/components/ProfileHero';
import { WishlistGrid } from '../features/wishlist/components/WishlistGrid';
import type { WishlistItem } from '../features/wishlist/types';

export default function App() {
  const [items, setItems] = useState<WishlistItem[]>([]);

  const handleAdd = () => {
    const newItem: WishlistItem = {
      id: Date.now().toString(),
      title: 'Новая хотелка',
      description: 'Тестовая хотелка',
      price: '—',
      priority: 'nice',
      link: 'https://example.com'
    };

    setItems((prev) => [newItem, ...prev]);
  };

  return (
    <AppShell>
      <AppHeader />
      <ProfileHero />
      <button
        onClick={handleAdd}
        className="mb-6 rounded-xl bg-rose-500 px-4 py-2 text-white shadow-sm hover:bg-rose-600"
      >
        Добавить ХОЧУ
      </button>
      <WishlistGrid items={items} />
    </AppShell>
  );
}
