import { useState } from 'react';
import Icon from '@/components/ui/icon';

type AuthMode = 'login' | 'register' | 'totp' | 'email-otp';

interface AuthPageProps {
  onAuth: (user: { id: string; login: string; name: string; email: string }) => void;
}

export default function AuthPage({ onAuth }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step2, setStep2] = useState<'totp' | 'email' | null>(null);

  const handleLogin = async () => {
    setError('');
    if (!login || !password) { setError('Введите логин и пароль'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setStep2('totp');
    setMode('totp');
  };

  const handleRegister = async () => {
    setError('');
    if (!login || !password || !name || !email) { setError('Заполните все поля'); return; }
    if (password.length < 8) { setError('Пароль должен быть не менее 8 символов'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    onAuth({ id: '1', login, name, email });
  };

  const handleTOTP = async () => {
    setError('');
    if (totpCode.length !== 6) { setError('Введите 6-значный код'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    setMode('email-otp');
  };

  const handleEmailOTP = async () => {
    setError('');
    if (emailCode.length !== 6) { setError('Введите 6-значный код из письма'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    onAuth({ id: '1', login, name: 'Пользователь', email: 'user@example.com' });
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
          <p className="text-muted-foreground text-sm">Облачное хранилище 1 ТБ</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          {mode === 'login' && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold mb-5 text-foreground">Вход в систему</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Логин ID</label>
                  <div className="relative">
                    <Icon name="AtSign" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      className="neon-input w-full rounded-xl pl-9 pr-4 py-2.5 text-sm"
                      placeholder="ваш_логин"
                      value={login}
                      onChange={e => setLogin(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Пароль</label>
                  <div className="relative">
                    <Icon name="Lock" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      className="neon-input w-full rounded-xl pl-9 pr-10 py-2.5 text-sm"
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <Icon name={showPass ? 'EyeOff' : 'Eye'} size={16} />
                    </button>
                  </div>
                </div>
              </div>
              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
              <button onClick={handleLogin} disabled={loading}
                className="neon-btn w-full rounded-xl py-2.5 text-sm mt-4 flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="LogIn" size={16} />}
                {loading ? 'Проверяем...' : 'Войти'}
              </button>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">или</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <button onClick={() => setMode('register')}
                className="w-full rounded-xl py-2.5 text-sm border border-[rgba(26,143,255,0.3)] text-neon-blue hover:bg-[rgba(26,143,255,0.08)] transition-all">
                Создать аккаунт
              </button>
            </div>
          )}

          {mode === 'register' && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold mb-5 text-foreground">Регистрация</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Имя</label>
                  <div className="relative">
                    <Icon name="User" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input className="neon-input w-full rounded-xl pl-9 pr-4 py-2.5 text-sm"
                      placeholder="Иван Иванов" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Логин ID</label>
                  <div className="relative">
                    <Icon name="AtSign" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input className="neon-input w-full rounded-xl pl-9 pr-4 py-2.5 text-sm"
                      placeholder="уникальный_логин" value={login} onChange={e => setLogin(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                  <div className="relative">
                    <Icon name="Mail" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input className="neon-input w-full rounded-xl pl-9 pr-4 py-2.5 text-sm"
                      placeholder="mail@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Пароль</label>
                  <div className="relative">
                    <Icon name="Lock" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input className="neon-input w-full rounded-xl pl-9 pr-10 py-2.5 text-sm"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Минимум 8 символов" value={password} onChange={e => setPassword(e.target.value)} />
                    <button onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <Icon name={showPass ? 'EyeOff' : 'Eye'} size={16} />
                    </button>
                  </div>
                </div>
              </div>
              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
              <button onClick={handleRegister} disabled={loading}
                className="neon-btn w-full rounded-xl py-2.5 text-sm mt-4 flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="UserPlus" size={16} />}
                {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
              </button>
              <button onClick={() => setMode('login')}
                className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
                Уже есть аккаунт? Войти
              </button>
            </div>
          )}

          {mode === 'totp' && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(26,143,255,0.15)' }}>
                  <Icon name="Smartphone" size={20} className="text-neon" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">TOTP Аутентификация</h2>
                  <p className="text-xs text-muted-foreground">Google Authenticator / Authy</p>
                </div>
              </div>
              <div className="bg-[rgba(26,143,255,0.06)] rounded-xl p-3 mb-4 border border-[rgba(26,143,255,0.15)]">
                <p className="text-xs text-muted-foreground">Откройте приложение-аутентификатор и введите 6-значный код для аккаунта <span className="text-neon">{login}</span></p>
              </div>
              <label className="text-xs text-muted-foreground mb-1 block">Код из приложения</label>
              <input className="neon-input w-full rounded-xl px-4 py-3 text-center text-2xl font-bold mono tracking-[0.5em]"
                placeholder="000000" maxLength={6} value={totpCode}
                onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))} />
              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
              <button onClick={handleTOTP} disabled={loading}
                className="neon-btn w-full rounded-xl py-2.5 text-sm mt-4 flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="ShieldCheck" size={16} />}
                {loading ? 'Проверяем...' : 'Подтвердить'}
              </button>
            </div>
          )}

          {mode === 'email-otp' && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(0,212,255,0.15)' }}>
                  <Icon name="Mail" size={20} className="text-neon-cyan" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Подтверждение Email</h2>
                  <p className="text-xs text-muted-foreground">Второй фактор защиты</p>
                </div>
              </div>
              <div className="bg-[rgba(0,212,255,0.06)] rounded-xl p-3 mb-4 border border-[rgba(0,212,255,0.15)]">
                <p className="text-xs text-muted-foreground">Мы отправили 6-значный код на вашу почту. Проверьте входящие.</p>
              </div>
              <label className="text-xs text-muted-foreground mb-1 block">Код из письма</label>
              <input className="neon-input w-full rounded-xl px-4 py-3 text-center text-2xl font-bold mono tracking-[0.5em]"
                placeholder="000000" maxLength={6} value={emailCode}
                onChange={e => setEmailCode(e.target.value.replace(/\D/g, ''))} />
              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
              <button onClick={handleEmailOTP} disabled={loading}
                className="neon-btn w-full rounded-xl py-2.5 text-sm mt-4 flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="CheckCircle" size={16} />}
                {loading ? 'Входим...' : 'Войти'}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          <Icon name="Shield" size={12} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">AES-256 · 2FA · Военное шифрование</span>
        </div>
      </div>
    </div>
  );
}
