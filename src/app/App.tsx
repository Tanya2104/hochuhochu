import { AppShell } from '../components/layout/AppShell';
import { AppHeader } from '../components/layout/AppHeader';
import { ProfileHero } from '../features/profile/components/ProfileHero';
import { WishlistGrid } from '../features/wishlist/components/WishlistGrid';
import type { WishlistItem } from '../features/wishlist/types';

export default function App() {
  const items: WishlistItem[] = [];

  return (
    <AppShell>
      <AppHeader />
      <ProfileHero />
      <WishlistGrid items={items} />
    </AppShell>
  );
}
