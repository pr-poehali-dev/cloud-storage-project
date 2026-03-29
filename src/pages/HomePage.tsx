import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { getAllFilesSize, getAllFilesCount, getFiles, getFolders } from '@/lib/db';

interface User {
  login: string;
  name: string;
}

interface HomePageProps {
  user: User;
  onNavigate: (page: 'home' | 'storage' | 'profile' | 'security') => void;
}

const MAX_BYTES = 1 * 1024 * 1024 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} КБ`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} МБ`;
  return `${(bytes / 1073741824).toFixed(2)} ГБ`;
}

export default function HomePage({ user, onNavigate }: HomePageProps) {
  const [usedBytes, setUsedBytes] = useState(0);
  const [fileCount, setFileCount] = useState(0);
  const [folderCount, setFolderCount] = useState(0);
  const [recentFiles, setRecentFiles] = useState<{ name: string; size: number; mimeType: string; createdAt: number }[]>([]);

  useEffect(() => {
    async function load() {
      const [size, count, folders, files] = await Promise.all([
        getAllFilesSize(),
        getAllFilesCount(),
        getFolders(null),
        getFiles(null),
      ]);
      setUsedBytes(size);
      setFileCount(count);
      setFolderCount(folders.length);
      setRecentFiles(files.slice(0, 4));
    }
    load();
  }, []);

  const usedPct = Math.min(100, (usedBytes / MAX_BYTES) * 100);

  function getFileIcon(mime: string): { icon: string; color: string } {
    if (mime.startsWith('image/')) return { icon: 'Image', color: '#ec4899' };
    if (mime.startsWith('video/')) return { icon: 'Video', color: '#a855f7' };
    if (mime.startsWith('audio/')) return { icon: 'Music', color: '#f59e0b' };
    if (mime.includes('pdf')) return { icon: 'FileText', color: '#ef4444' };
    if (mime.includes('zip') || mime.includes('rar')) return { icon: 'Archive', color: '#8b5cf6' };
    if (mime.includes('sheet') || mime.includes('excel')) return { icon: 'FileSpreadsheet', color: '#22c55e' };
    return { icon: 'File', color: '#1a8fff' };
  }

  function timeAgo(ts: number): string {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`;
    return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  }

  return (
    <div className="min-h-screen bg-background bg-grid pb-24">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(26,143,255,0.06)] to-transparent pointer-events-none" />
        <div className="px-4 pt-12 pb-6 relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-muted-foreground text-sm">Привет,</p>
              <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="pulse-dot" />
                <span className="text-xs text-muted-foreground">Локально</span>
              </div>
              <button onClick={() => onNavigate('profile')}
                className="w-9 h-9 rounded-xl neon-border flex items-center justify-center"
                style={{ background: 'rgba(26,143,255,0.12)' }}>
                <Icon name="User" size={17} className="text-neon" />
              </button>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 mb-4 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Занято на устройстве</p>
                <p className="text-lg font-bold text-foreground">
                  {formatSize(usedBytes)} <span className="text-sm font-normal text-muted-foreground">/ 1 ТБ</span>
                </p>
              </div>
              <p className="text-2xl font-bold text-neon mono">{usedPct < 0.01 ? '0' : usedPct.toFixed(1)}%</p>
            </div>
            <div className="h-2 bg-[rgba(26,143,255,0.12)] rounded-full overflow-hidden">
              <div className="progress-neon h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.max(usedPct, 0.2)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{formatSize(MAX_BYTES - usedBytes)} свободно</p>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Файлов', value: fileCount.toString(), icon: 'Files', color: '#1a8fff' },
            { label: 'Папок', value: folderCount.toString(), icon: 'FolderOpen', color: '#00d4ff' },
            { label: 'Шифрование', value: 'ON', icon: 'ShieldCheck', color: '#22c55e' },
          ].map((s, i) => (
            <div key={s.label} className={`glass-card rounded-xl p-3 text-center animate-fade-in delay-${(i + 1) * 100}`}>
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

        {recentFiles.length > 0 && (
          <div className="mb-4 animate-fade-in delay-200">
            <p className="section-header mb-3">Последние файлы</p>
            <div className="space-y-2">
              {recentFiles.map(file => {
                const { icon, color } = getFileIcon(file.mimeType);
                return (
                  <div key={file.createdAt + file.name}
                    className="file-item" onClick={() => onNavigate('storage')}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}20` }}>
                      <Icon name={icon} size={18} style={{ color }} fallback="File" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(file.size)} · {timeAgo(file.createdAt)}</p>
                    </div>
                    <Icon name="Lock" size={12} className="text-muted-foreground opacity-40" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="glass-card rounded-2xl p-4 animate-fade-in delay-300"
          style={{ background: 'linear-gradient(135deg, rgba(26,143,255,0.07) 0%, rgba(0,212,255,0.04) 100%)' }}>
          <div className="flex items-center gap-3 mb-3">
            <Icon name="Shield" size={18} className="text-neon" />
            <p className="text-sm font-semibold text-foreground">Zero-Knowledge хранилище</p>
          </div>
          <div className="space-y-1.5">
            {[
              'Файлы шифруются прямо в браузере (AES-GCM 256-bit)',
              'Ключ выводится из пароля через PBKDF2 × 310 000',
              'Никаких серверов, никаких запросов, полная анонимность',
            ].map(t => (
              <div key={t} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-neon mt-1.5 flex-shrink-0" style={{ background: '#1a8fff' }} />
                <p className="text-xs text-muted-foreground">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
