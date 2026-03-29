import { useState } from 'react';
import AuthPage from './AuthPage';
import HomePage from './HomePage';
import StoragePage from './StoragePage';
import ProfilePage from './ProfilePage';
import SecurityPage from './SecurityPage';
import BottomNav from '@/components/BottomNav';

type Page = 'home' | 'storage' | 'profile' | 'security';

interface User {
  id: string;
  login: string;
  name: string;
  email: string;
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>('home');

  if (!user) {
    return <AuthPage onAuth={(u) => setUser(u)} />;
  }

  return (
    <div className="relative">
      {page === 'home' && <HomePage user={user} onNavigate={setPage} />}
      {page === 'storage' && <StoragePage />}
      {page === 'profile' && <ProfilePage user={user} onUpdate={setUser} onLogout={() => setUser(null)} />}
      {page === 'security' && <SecurityPage />}
      <BottomNav current={page} onChange={setPage} />
    </div>
  );
}
