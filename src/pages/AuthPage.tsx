import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { deriveKey, hashPassword, randomSalt, uint8ToBase64, base64ToUint8 } from '@/lib/crypto';
import { saveAccount, loadAccount, saveSession } from '@/lib/db';

type AuthMode = 'login' | 'register';

interface AuthPageProps {
  onAuth: (user: { login: string; name: string }, cryptoKey: CryptoKey) => void;
}

export default function AuthPage({ onAuth }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!login.trim() || !password) { setError('Введите логин и пароль'); return; }
    setLoading(true);
    setLoadingText('Получаем ключ шифрования...');
    try {
      const account = loadAccount();
      if (!account || account.login !== login.trim()) {
        setError('Аккаунт не найден на этом устройстве');
        setLoading(false);
        return;
      }
      const salt = base64ToUint8(account.salt);
      const testHash = await hashPassword(password, salt);
      if (testHash !== account.passwordHash) {
        setError('Неверный пароль');
        setLoading(false);
        return;
      }
      setLoadingText('Разблокируем хранилище...');
      const cryptoKey = await deriveKey(password, salt);
      saveSession(login.trim());
      onAuth({ login: account.login, name: account.name }, cryptoKey);
    } catch {
      setError('Ошибка входа');
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    setError('');
    if (!login.trim() || !password || !name.trim()) { setError('Заполните все поля'); return; }
    if (login.trim().length < 3) { setError('Логин должен быть не менее 3 символов'); return; }
    if (password.length < 8) { setError('Пароль должен быть не менее 8 символов'); return; }
    const existing = loadAccount();
    if (existing) {
      setError('На этом устройстве уже есть аккаунт. Войдите или сбросьте данные.');
      return;
    }
    setLoading(true);
    setLoadingText('Генерируем ключ шифрования...');
    try {
      const salt = randomSalt();
      setLoadingText('Хешируем пароль (PBKDF2 × 310 000)...');
      const passwordHash = await hashPassword(password, salt);
      setLoadingText('Создаём защищённое хранилище...');
      saveAccount({
        login: login.trim(),
        name: name.trim(),
        passwordHash,
        salt: uint8ToBase64(salt),
        createdAt: Date.now(),
      });
      const cryptoKey = await deriveKey(password, salt);
      saveSession(login.trim());
      onAuth({ login: login.trim(), name: name.trim() }, cryptoKey);
    } catch {
      setError('Ошибка создания аккаунта');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background bg-grid flex items-center justify-center px-4 relative overflow-hidden">
      <div className="scan-line" />
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-[rgba(26,143,255,0.08)] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-[rgba(0,212,255,0.06)] rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl neon-border mb-4 animate-float"
            style={{ background: 'linear-gradient(135deg, rgba(26,143,255,0.2) 0%, rgba(0,212,255,0.1) 100%)' }}>
            <Icon name="HardDrive" size={28} className="text-neon" />
          </div>
          <h1 className="text-2xl font-bold text-neon mb-1 mono">NovaDrive</h1>
          <p className="text-muted-foreground text-sm">Бессерверное хранилище · Zero-Knowledge</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          {loading ? (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(26,143,255,0.15)', boxShadow: 'var(--neon-glow)' }}>
                <Icon name="Lock" size={24} className="text-neon animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground">{loadingText}</p>
              <div className="mt-4 h-1 bg-[rgba(26,143,255,0.12)] rounded-full overflow-hidden">
                <div className="progress-neon h-full rounded-full w-2/3 animate-pulse" />
              </div>
            </div>
          ) : mode === 'login' ? (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold mb-1 text-foreground">Войти в хранилище</h2>
              <p className="text-xs text-muted-foreground mb-5">Ключ выводится из пароля локально</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Логин</label>
                  <div className="relative">
                    <Icon name="AtSign" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input className="neon-input w-full rounded-xl pl-9 pr-4 py-2.5 text-sm"
                      placeholder="ваш_логин" value={login}
                      onChange={e => setLogin(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Пароль</label>
                  <div className="relative">
                    <Icon name="Lock" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input className="neon-input w-full rounded-xl pl-9 pr-10 py-2.5 text-sm"
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••" value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                    <button onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <Icon name={showPass ? 'EyeOff' : 'Eye'} size={16} />
                    </button>
                  </div>
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                  <Icon name="AlertCircle" size={14} className="text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}
              <button onClick={handleLogin}
                className="neon-btn w-full rounded-xl py-2.5 text-sm mt-4 flex items-center justify-center gap-2">
                <Icon name="Unlock" size={16} />
                Разблокировать
              </button>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">или</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <button onClick={() => { setMode('register'); setError(''); }}
                className="w-full rounded-xl py-2.5 text-sm border border-[rgba(26,143,255,0.3)] text-[#1a8fff] hover:bg-[rgba(26,143,255,0.08)] transition-all">
                Создать новое хранилище
              </button>
            </div>
          ) : (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold mb-1 text-foreground">Новое хранилище</h2>
              <p className="text-xs text-muted-foreground mb-5">Данные хранятся только на вашем устройстве</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Ваше имя</label>
                  <div className="relative">
                    <Icon name="User" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input className="neon-input w-full rounded-xl pl-9 pr-4 py-2.5 text-sm"
                      placeholder="Иван" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Логин</label>
                  <div className="relative">
                    <Icon name="AtSign" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input className="neon-input w-full rounded-xl pl-9 pr-4 py-2.5 text-sm"
                      placeholder="мой_логин" value={login} onChange={e => setLogin(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Пароль шифрования</label>
                  <div className="relative">
                    <Icon name="Lock" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input className="neon-input w-full rounded-xl pl-9 pr-10 py-2.5 text-sm"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Минимум 8 символов" value={password}
                      onChange={e => setPassword(e.target.value)} />
                    <button onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <Icon name={showPass ? 'EyeOff' : 'Eye'} size={16} />
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-1.5 h-1 rounded-full overflow-hidden bg-[rgba(255,255,255,0.06)]">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (password.length / 16) * 100)}%`,
                          background: password.length < 8 ? '#ef4444' : password.length < 12 ? '#f59e0b' : '#22c55e'
                        }} />
                    </div>
                  )}
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                  <Icon name="AlertCircle" size={14} className="text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}
              <div className="mt-4 p-3 rounded-xl bg-[rgba(26,143,255,0.06)] border border-[rgba(26,143,255,0.12)]">
                <div className="flex items-start gap-2">
                  <Icon name="Info" size={13} className="text-[#1a8fff] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Пароль невозможно восстановить — он является ключом шифрования. Сохраните его в надёжном месте.
                  </p>
                </div>
              </div>
              <button onClick={handleRegister}
                className="neon-btn w-full rounded-xl py-2.5 text-sm mt-4 flex items-center justify-center gap-2">
                <Icon name="ShieldCheck" size={16} />
                Создать хранилище
              </button>
              <button onClick={() => { setMode('login'); setError(''); }}
                className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
                Уже есть хранилище? Войти
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
          {[
            { icon: 'Shield', label: 'AES-GCM 256' },
            { icon: 'Wifi', label: 'Нет запросов' },
            { icon: 'Server', label: 'Нет сервера' },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-1.5">
              <Icon name={b.icon} size={11} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
