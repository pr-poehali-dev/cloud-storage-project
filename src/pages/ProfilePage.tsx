import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface User {
  id: string;
  login: string;
  name: string;
  email: string;
}

interface ProfilePageProps {
  user: User;
  onUpdate: (user: User) => void;
  onLogout: () => void;
  onExport: () => void;
}

export default function ProfilePage({ user, onUpdate, onLogout, onExport }: ProfilePageProps) {
  const [editing, setEditing] = useState<'name' | 'login' | 'password' | null>(null);
  const [name, setName] = useState(user.name);
  const [login, setLogin] = useState(user.login);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const toast = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const saveName = async () => {
    if (!name.trim()) { setError('Введите имя'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    onUpdate({ ...user, name });
    setEditing(null);
    toast('Имя обновлено');
  };

  const saveLogin = async () => {
    if (!login.trim()) { setError('Введите логин'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    onUpdate({ ...user, login });
    setEditing(null);
    toast('Логин обновлён');
  };

  const savePassword = async () => {
    setError('');
    if (!oldPass) { setError('Введите текущий пароль'); return; }
    if (newPass.length < 8) { setError('Новый пароль должен быть не менее 8 символов'); return; }
    if (newPass !== confirmPass) { setError('Пароли не совпадают'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setEditing(null);
    setOldPass(''); setNewPass(''); setConfirmPass('');
    toast('Пароль изменён');
  };

  const startEditing = (field: typeof editing) => {
    setError('');
    setEditing(field);
  };

  return (
    <div className="min-h-screen bg-background bg-grid pb-24">
      <div className="px-4 pt-12 pb-6">
        <h1 className="text-xl font-bold text-foreground mb-6">Профиль</h1>

        <div className="glass-card rounded-2xl p-5 mb-4 text-center animate-fade-in">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: 'linear-gradient(135deg, rgba(26,143,255,0.25) 0%, rgba(0,212,255,0.15) 100%)', border: '1px solid rgba(26,143,255,0.3)', boxShadow: 'var(--neon-glow)' }}>
              <span className="text-3xl font-bold text-neon">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(26,143,255,0.3)', border: '1px solid rgba(26,143,255,0.4)' }}>
              <Icon name="Camera" size={12} className="text-neon" />
            </div>
          </div>
          <p className="font-bold text-lg text-foreground">{user.name}</p>
          <p className="text-muted-foreground text-sm">@{user.login}</p>
          <p className="text-muted-foreground text-xs mt-1">{user.email}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="badge-neon">Pro</span>
            <span className="badge-neon">1 ТБ</span>
          </div>
        </div>

        {success && (
          <div className="glass-card rounded-xl p-3 mb-4 border-[rgba(34,197,94,0.3)] flex items-center gap-2 animate-fade-in">
            <Icon name="CheckCircle" size={16} className="text-green-400" />
            <span className="text-sm text-green-400">{success}</span>
          </div>
        )}

        <div className="glass-card rounded-2xl overflow-hidden mb-4 animate-fade-in delay-100">
          <div className="px-4 py-3 border-b border-[rgba(26,143,255,0.08)]">
            <p className="section-header">Личные данные</p>
          </div>

          <div className="divide-y divide-[rgba(26,143,255,0.06)]">
            <div className="px-4 py-3 flex items-center justify-between"
              onClick={() => startEditing('name')}>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Имя</p>
                {editing === 'name' ? (
                  <input className="neon-input rounded-lg px-3 py-1.5 text-sm w-full mt-1"
                    value={name} onChange={e => setName(e.target.value)}
                    autoFocus onKeyDown={e => e.key === 'Enter' && saveName()} />
                ) : (
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                )}
              </div>
              {editing === 'name' ? (
                <div className="flex gap-2 ml-3">
                  <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground p-1"><Icon name="X" size={16} /></button>
                  <button onClick={saveName} disabled={loading} className="text-neon p-1"><Icon name={loading ? 'Loader2' : 'Check'} size={16} className={loading ? 'animate-spin' : ''} /></button>
                </div>
              ) : (
                <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
              )}
            </div>

            <div className="px-4 py-3 flex items-center justify-between"
              onClick={() => startEditing('login')}>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Логин ID</p>
                {editing === 'login' ? (
                  <input className="neon-input rounded-lg px-3 py-1.5 text-sm w-full mt-1"
                    value={login} onChange={e => setLogin(e.target.value)}
                    autoFocus onKeyDown={e => e.key === 'Enter' && saveLogin()} />
                ) : (
                  <p className="text-sm font-medium text-foreground mono">@{user.login}</p>
                )}
              </div>
              {editing === 'login' ? (
                <div className="flex gap-2 ml-3">
                  <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground p-1"><Icon name="X" size={16} /></button>
                  <button onClick={saveLogin} disabled={loading} className="text-neon p-1"><Icon name={loading ? 'Loader2' : 'Check'} size={16} className={loading ? 'animate-spin' : ''} /></button>
                </div>
              ) : (
                <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
              )}
            </div>

            <div className="px-4 py-3">
              <p className="text-xs text-muted-foreground mb-0.5">Email</p>
              <p className="text-sm font-medium text-foreground">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden mb-4 animate-fade-in delay-200">
          <div className="px-4 py-3 border-b border-[rgba(26,143,255,0.08)]">
            <p className="section-header">Безопасность аккаунта</p>
          </div>
          <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-[rgba(26,143,255,0.05)] transition-colors"
            onClick={() => startEditing('password')}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(26,143,255,0.15)' }}>
                <Icon name="Lock" size={15} className="text-neon" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Изменить пароль</p>
                <p className="text-xs text-muted-foreground">Последнее изменение: 14 дней назад</p>
              </div>
            </div>
            <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
          </button>
        </div>

        {editing === 'password' && (
          <div className="glass-card rounded-2xl p-5 mb-4 animate-scale-in">
            <h3 className="font-bold text-foreground mb-4">Изменить пароль</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Текущий пароль</label>
                <div className="relative">
                  <input className="neon-input w-full rounded-xl px-4 pr-10 py-2.5 text-sm"
                    type={showPass ? 'text' : 'password'} placeholder="••••••••"
                    value={oldPass} onChange={e => setOldPass(e.target.value)} />
                  <button onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Icon name={showPass ? 'EyeOff' : 'Eye'} size={16} />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Новый пароль</label>
                <input className="neon-input w-full rounded-xl px-4 py-2.5 text-sm"
                  type="password" placeholder="Минимум 8 символов"
                  value={newPass} onChange={e => setNewPass(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Подтвердите пароль</label>
                <input className="neon-input w-full rounded-xl px-4 py-2.5 text-sm"
                  type="password" placeholder="Повторите пароль"
                  value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
              </div>
            </div>
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setEditing(null); setError(''); }}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Отмена</button>
              <button onClick={savePassword} disabled={loading}
                className="flex-1 neon-btn rounded-xl py-2.5 text-sm flex items-center justify-center gap-2">
                {loading && <Icon name="Loader2" size={14} className="animate-spin" />}
                Сохранить
              </button>
            </div>
          </div>
        )}

        <div className="glass-card rounded-2xl overflow-hidden mb-6 animate-fade-in delay-300">
          <div className="px-4 py-3 border-b border-[rgba(26,143,255,0.08)]">
            <p className="section-header">Хранилище</p>
          </div>
          <div className="px-4 py-3">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-muted-foreground">Использовано</p>
              <p className="text-sm font-bold text-foreground mono">347.2 ГБ / 1 ТБ</p>
            </div>
            <div className="h-2 bg-[rgba(26,143,255,0.12)] rounded-full overflow-hidden">
              <div className="progress-neon h-full rounded-full" style={{ width: '33.9%' }} />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden mb-4 animate-fade-in delay-300">
          <div className="px-4 py-3 border-b border-[rgba(26,143,255,0.08)]">
            <p className="section-header">Перенос данных</p>
          </div>
          <button onClick={onExport}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[rgba(26,143,255,0.05)] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(0,212,255,0.15)' }}>
                <Icon name="PackageOpen" size={15} className="text-neon-cyan" fallback="Archive" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Экспорт / Импорт хранилища</p>
                <p className="text-xs text-muted-foreground">Зашифрованный .ndrive архив</p>
              </div>
            </div>
            <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
          </button>
        </div>

        <button onClick={onLogout}
          className="w-full py-3 rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium flex items-center justify-center gap-2">
          <Icon name="LogOut" size={16} />
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}