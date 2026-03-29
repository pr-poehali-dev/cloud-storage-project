import { useState, useEffect } from 'react';
import AuthPage from './AuthPage';
import HomePage from './HomePage';
import StoragePage from './StoragePage';
import ProfilePage from './ProfilePage';
import SecurityPage from './SecurityPage';
import ExportPage from './ExportPage';
import BottomNav from '@/components/BottomNav';
import Icon from '@/components/ui/icon';
import { loadAccount, loadSession, saveAccount } from '@/lib/db';

type Page = 'home' | 'storage' | 'profile' | 'security' | 'export';

interface User {
  login: string;
  name: string;
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [page, setPage] = useState<Page>('home');
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    const session = loadSession();
    const account = loadAccount();
    if (session && account && session === account.login) {
      setUser({ login: account.login, name: account.name });
    }
    setRestoring(false);
  }, []);

  const handleAuth = (u: User, key: CryptoKey) => {
    setUser(u);
    setCryptoKey(key);
    setPage('home');
  };

  const handleLogout = () => {
    setUser(null);
    setCryptoKey(null);
    setPage('home');
    sessionStorage.removeItem('nd_session');
  };

  const handleUpdateUser = (u: { name: string; login: string; email: string }) => {
    const account = loadAccount();
    if (!account) return;
    const updated = { ...account, name: u.name, login: u.login };
    saveAccount(updated);
    setUser({ login: updated.login, name: updated.name });
  };

  if (restoring) {
    return (
      <div className="min-h-screen bg-background bg-grid flex items-center justify-center">
        <div className="text-center">
          <Icon name="HardDrive" size={32} className="text-neon mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-muted-foreground">Инициализация...</p>
        </div>
      </div>
    );
  }

  if (!user || !cryptoKey) {
    return <AuthPage onAuth={handleAuth} />;
  }

  const navPage = page === 'export' ? 'profile' : page;

  return (
    <div className="relative">
      {page === 'home' && <HomePage user={user} onNavigate={setPage} />}
      {page === 'storage' && <StoragePage cryptoKey={cryptoKey} />}
      {page === 'profile' && (
        <ProfilePage
          user={{ id: '1', login: user.login, name: user.name, email: '' }}
          onUpdate={handleUpdateUser}
          onLogout={handleLogout}
          onExport={() => setPage('export')}
        />
      )}
      {page === 'security' && <SecurityPage />}
      {page === 'export' && (
        <ExportPage
          onBack={() => setPage('profile')}
          onImportComplete={() => setPage('storage')}
        />
      )}
      <BottomNav current={navPage as 'home' | 'storage' | 'profile' | 'security'} onChange={setPage} />
    </div>
  );
}
