import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface SecurityItem {
  id: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
  enabled: boolean;
  badge?: string;
}

export default function SecurityPage() {
  const [items, setItems] = useState<SecurityItem[]>([
    { id: 'totp', title: 'TOTP Аутентификация', desc: 'Google Authenticator / Authy', icon: 'Smartphone', color: '#1a8fff', enabled: true, badge: 'Активно' },
    { id: 'email2fa', title: 'Подтверждение Email', desc: 'Код на почту при каждом входе', icon: 'Mail', color: '#00d4ff', enabled: true, badge: 'Активно' },
    { id: 'encrypt', title: 'AES-256 шифрование', desc: 'Военный стандарт шифрования файлов', icon: 'Shield', color: '#22c55e', enabled: true, badge: 'Всегда' },
    { id: 'sync_encrypt', title: 'Шифрование при передаче', desc: 'TLS 1.3 для всех соединений', icon: 'Lock', color: '#f59e0b', enabled: true, badge: 'Всегда' },
    { id: 'sessions', title: 'Управление сессиями', desc: 'Только одна активная сессия', icon: 'Monitor', color: '#a855f7', enabled: false },
    { id: 'alert', title: 'Уведомления о входе', desc: 'Email при входе с нового устройства', icon: 'Bell', color: '#ec4899', enabled: true },
  ]);

  const [totpModal, setTotpModal] = useState(false);
  const [totpStep, setTotpStep] = useState<'scan' | 'verify'>('scan');
  const [totpCode, setTotpCode] = useState('');

  const toggle = (id: string) => {
    if (id === 'encrypt' || id === 'sync_encrypt') return;
    setItems(prev => prev.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i));
  };

  const sessions = [
    { device: 'iPhone 15 Pro', location: 'Москва, Россия', time: 'Активен сейчас', current: true, icon: 'Smartphone' },
    { device: 'MacBook Pro', location: 'Москва, Россия', time: '2 часа назад', current: false, icon: 'Monitor' },
    { device: 'Chrome · Windows', location: 'Санкт-Петербург', time: 'Вчера, 18:44', current: false, icon: 'Globe' },
  ];

  return (
    <div className="min-h-screen bg-background bg-grid pb-24">
      <div className="px-4 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(26,143,255,0.15)', boxShadow: 'var(--neon-glow)' }}>
            <Icon name="ShieldCheck" size={20} className="text-neon" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Безопасность</h1>
            <p className="text-xs text-muted-foreground">Военный уровень защиты данных</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 mb-6 animate-fade-in"
          style={{ background: 'linear-gradient(135deg, rgba(26,143,255,0.08) 0%, rgba(0,212,255,0.05) 100%)', border: '1px solid rgba(26,143,255,0.2)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="pulse-dot" />
            <p className="text-sm font-semibold text-foreground">Уровень безопасности: Максимальный</p>
          </div>
          <div className="flex gap-1.5">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex-1 h-1.5 rounded-full"
                style={{ background: i <= 5 ? 'linear-gradient(90deg, #1a8fff, #00d4ff)' : 'rgba(26,143,255,0.15)',
                  boxShadow: i <= 5 ? '0 0 6px rgba(26,143,255,0.6)' : 'none' }} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: 'Шифрование', value: 'AES-256', icon: 'Lock' },
              { label: 'Протокол', value: 'TLS 1.3', icon: 'Wifi' },
              { label: '2FA', value: 'TOTP+Email', icon: 'Shield' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <Icon name={s.icon} size={14} className="text-neon mx-auto mb-1" />
                <p className="text-xs font-bold text-neon mono">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="section-header mb-3">Настройки защиты</p>
        <div className="glass-card rounded-2xl overflow-hidden mb-6 animate-fade-in delay-100">
          {items.map((item, i) => (
            <div key={item.id}
              className={`px-4 py-3.5 flex items-center gap-3 ${i < items.length - 1 ? 'border-b border-[rgba(26,143,255,0.06)]' : ''}`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${item.color}20` }}>
                <Icon name={item.icon} size={17} style={{ color: item.color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <div className="flex items-center gap-2">
                {item.badge && (
                  <span className="badge-neon text-[10px]">{item.badge}</span>
                )}
                {item.id !== 'encrypt' && item.id !== 'sync_encrypt' && (
                  <button onClick={() => toggle(item.id)}
                    className={`relative w-11 h-6 rounded-full transition-all duration-300 ${item.enabled ? 'bg-[rgba(26,143,255,0.8)]' : 'bg-[rgba(255,255,255,0.1)]'}`}
                    style={{ boxShadow: item.enabled ? 'var(--neon-glow)' : 'none' }}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${item.enabled ? 'left-6' : 'left-1'}`} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="section-header mb-3">TOTP Аутентификатор</p>
        <div className="glass-card rounded-2xl p-4 mb-6 animate-fade-in delay-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(26,143,255,0.15)', border: '1px solid rgba(26,143,255,0.3)' }}>
              <Icon name="Smartphone" size={22} className="text-neon" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Google Authenticator</p>
              <p className="text-xs text-muted-foreground">Приложение подключено · 1 устройство</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { setTotpModal(true); setTotpStep('scan'); setTotpCode(''); }}
              className="py-2 rounded-xl border border-[rgba(26,143,255,0.3)] text-sm text-neon-blue hover:bg-[rgba(26,143,255,0.08)] transition-all flex items-center justify-center gap-2">
              <Icon name="QrCode" size={14} />
              Показать QR
            </button>
            <button className="py-2 rounded-xl border border-[rgba(26,143,255,0.3)] text-sm text-neon-blue hover:bg-[rgba(26,143,255,0.08)] transition-all flex items-center justify-center gap-2">
              <Icon name="RefreshCw" size={14} />
              Пересоздать
            </button>
          </div>
        </div>

        <p className="section-header mb-3">Активные сессии</p>
        <div className="glass-card rounded-2xl overflow-hidden animate-fade-in delay-300">
          {sessions.map((session, i) => (
            <div key={session.device}
              className={`px-4 py-3.5 flex items-center gap-3 ${i < sessions.length - 1 ? 'border-b border-[rgba(26,143,255,0.06)]' : ''}`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: session.current ? 'rgba(26,143,255,0.15)' : 'rgba(255,255,255,0.05)' }}>
                <Icon name={session.icon} size={17} className={session.current ? 'text-neon' : 'text-muted-foreground'} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{session.device}</p>
                  {session.current && <span className="badge-neon text-[10px]">Текущая</span>}
                </div>
                <p className="text-xs text-muted-foreground">{session.location} · {session.time}</p>
              </div>
              {!session.current && (
                <button className="text-red-400 hover:text-red-300 p-1">
                  <Icon name="X" size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {totpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setTotpModal(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative glass-card rounded-2xl p-6 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
            {totpStep === 'scan' ? (
              <>
                <h3 className="font-bold text-foreground mb-2 text-center">Настройка TOTP</h3>
                <p className="text-xs text-muted-foreground text-center mb-4">Отсканируйте QR-код в приложении Google Authenticator или Authy</p>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-40 h-40 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(26,143,255,0.08)', border: '2px dashed rgba(26,143,255,0.3)' }}>
                    <div className="text-center">
                      <Icon name="QrCode" size={48} className="text-neon mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">QR код</p>
                    </div>
                  </div>
                </div>
                <div className="bg-[rgba(26,143,255,0.06)] rounded-xl p-3 mb-4 border border-[rgba(26,143,255,0.15)]">
                  <p className="text-xs text-muted-foreground text-center">Ключ вручную: <span className="mono text-neon font-bold">XXXX XXXX XXXX XXXX</span></p>
                </div>
                <button onClick={() => setTotpStep('verify')}
                  className="neon-btn w-full rounded-xl py-2.5 text-sm">
                  Далее — подтвердить код
                </button>
              </>
            ) : (
              <>
                <h3 className="font-bold text-foreground mb-2 text-center">Подтвердить TOTP</h3>
                <p className="text-xs text-muted-foreground text-center mb-4">Введите 6-значный код из приложения</p>
                <input className="neon-input w-full rounded-xl px-4 py-3 text-center text-2xl font-bold mono tracking-[0.5em] mb-4"
                  placeholder="000000" maxLength={6}
                  value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))} />
                <div className="flex gap-2">
                  <button onClick={() => setTotpStep('scan')} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground">Назад</button>
                  <button onClick={() => setTotpModal(false)} className="flex-1 neon-btn rounded-xl py-2.5 text-sm">Подтвердить</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
