import Icon from '@/components/ui/icon';

interface User {
  id: string;
  login: string;
  name: string;
  email: string;
}

interface HomePageProps {
  user: User;
  onNavigate: (page: 'home' | 'storage' | 'profile' | 'security') => void;
}

const usedGB = 347.2;
const totalGB = 1024;
const usedPercent = (usedGB / totalGB) * 100;

const recentFiles = [
  { name: 'Отчёт_Q1_2025.xlsx', size: '2.4 МБ', date: 'Сегодня', icon: 'FileSpreadsheet', color: '#22c55e' },
  { name: 'Презентация_проект.pptx', size: '18.7 МБ', date: 'Вчера', icon: 'FilePresentation', color: '#f59e0b' },
  { name: 'Фото_отпуск_2024.zip', size: '1.2 ГБ', date: '25 мар', icon: 'Archive', color: '#1a8fff' },
  { name: 'Contract_signed.pdf', size: '456 КБ', date: '24 мар', icon: 'FileText', color: '#ef4444' },
];

const stats = [
  { label: 'Файлов', value: '1 284', icon: 'Files', color: '#1a8fff' },
  { label: 'Папок', value: '47', icon: 'FolderOpen', color: '#00d4ff' },
  { label: 'Синхронизировано', value: '100%', icon: 'RefreshCw', color: '#22c55e' },
];

export default function HomePage({ user, onNavigate }: HomePageProps) {
  return (
    <div className="min-h-screen bg-background bg-grid pb-24">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(26,143,255,0.08)] to-transparent pointer-events-none" />
        <div className="px-4 pt-12 pb-6 relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-muted-foreground text-sm">Добро пожаловать,</p>
              <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="pulse-dot" />
              <button onClick={() => onNavigate('profile')}
                className="w-10 h-10 rounded-xl neon-border flex items-center justify-center"
                style={{ background: 'rgba(26,143,255,0.12)' }}>
                <Icon name="User" size={18} className="text-neon" />
              </button>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Использовано хранилище</p>
                <p className="text-lg font-bold text-foreground">
                  {usedGB} ГБ <span className="text-sm font-normal text-muted-foreground">/ 1 ТБ</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-neon mono">{usedPercent.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">{(totalGB - usedGB).toFixed(0)} ГБ свободно</p>
              </div>
            </div>
            <div className="h-2 bg-[rgba(26,143,255,0.12)] rounded-full overflow-hidden">
              <div className="progress-neon h-full rounded-full transition-all duration-1000"
                style={{ width: `${usedPercent}%` }} />
            </div>
            <div className="flex gap-2 mt-3">
              {[
                { color: '#1a8fff', label: 'Документы', pct: 35 },
                { color: '#22c55e', label: 'Фото', pct: 45 },
                { color: '#f59e0b', label: 'Видео', pct: 12 },
                { color: '#a855f7', label: 'Прочее', pct: 8 },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {stats.map((s, i) => (
            <div key={s.label} className={`glass-card rounded-xl p-3 text-center animate-fade-in delay-${(i+1)*100}`}>
              <div className="flex justify-center mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${s.color}20` }}>
                  <Icon name={s.icon} size={16} style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-base font-bold text-foreground mono">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => onNavigate('storage')}
            className="neon-btn flex-1 rounded-xl py-3 text-sm flex items-center justify-center gap-2">
            <Icon name="Upload" size={16} />
            Загрузить файл
          </button>
          <button onClick={() => onNavigate('storage')}
            className="flex-1 rounded-xl py-3 text-sm border border-[rgba(26,143,255,0.3)] text-foreground hover:bg-[rgba(26,143,255,0.08)] transition-all flex items-center justify-center gap-2">
            <Icon name="FolderPlus" size={16} />
            Новая папка
          </button>
        </div>

        <div className="mb-4">
          <p className="section-header mb-3">Последние файлы</p>
          <div className="space-y-2">
            {recentFiles.map((file, i) => (
              <div key={file.name} className={`file-item animate-fade-in delay-${(i+1)*100}`}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${file.color}20` }}>
                  <Icon name={file.icon} size={18} style={{ color: file.color }} fallback="File" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{file.size} · {file.date}</p>
                </div>
                <button className="text-muted-foreground hover:text-foreground p-1">
                  <Icon name="MoreVertical" size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(0,212,255,0.15)' }}>
              <Icon name="RefreshCw" size={18} className="text-neon-cyan" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Синхронизация активна</p>
              <p className="text-xs text-muted-foreground">Все устройства актуальны · только что</p>
            </div>
            <div className="pulse-dot" />
          </div>
        </div>
      </div>
    </div>
  );
}
