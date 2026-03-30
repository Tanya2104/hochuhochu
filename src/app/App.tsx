import { AppShell } from '../components/layout/AppShell';
import { AppHeader } from '../components/layout/AppHeader';
import { ProfileHero } from '../features/profile/components/ProfileHero';

export default function App() {
  return (
    <AppShell>
      <AppHeader />
      <ProfileHero />
    </AppShell>
  );
}
