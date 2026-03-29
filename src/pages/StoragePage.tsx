import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: string;
  date: string;
  icon: string;
  color: string;
  mimeType?: string;
}

const rootFiles: FileItem[] = [
  { id: '1', name: 'Документы', type: 'folder', date: 'Вчера', icon: 'Folder', color: '#1a8fff' },
  { id: '2', name: 'Фотографии', type: 'folder', date: '25 мар', icon: 'Folder', color: '#f59e0b' },
  { id: '3', name: 'Видео', type: 'folder', date: '20 мар', icon: 'Folder', color: '#a855f7' },
  { id: '4', name: 'Резервные копии', type: 'folder', date: '15 мар', icon: 'Folder', color: '#22c55e' },
  { id: '5', name: 'Отчёт_финансы.xlsx', type: 'file', size: '4.2 МБ', date: 'Сегодня', icon: 'FileSpreadsheet', color: '#22c55e', mimeType: 'xlsx' },
  { id: '6', name: 'Договор_2025.pdf', type: 'file', size: '1.1 МБ', date: 'Вчера', icon: 'FileText', color: '#ef4444', mimeType: 'pdf' },
  { id: '7', name: 'Фото_проект.jpg', type: 'file', size: '3.8 МБ', date: '25 мар', icon: 'Image', color: '#ec4899', mimeType: 'jpg' },
  { id: '8', name: 'Архив_2024.zip', type: 'file', size: '892 МБ', date: '10 мар', icon: 'Archive', color: '#8b5cf6', mimeType: 'zip' },
];

type ModalType = 'rename' | 'copy' | 'delete' | 'new-folder' | 'upload' | null;

export default function StoragePage() {
  const [files, setFiles] = useState<FileItem[]>(rootFiles);
  const [path, setPath] = useState<string[]>([]);
  const [selected, setSelected] = useState<FileItem | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [newName, setNewName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'list' | 'grid'>('list');

  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openMenu = (e: React.MouseEvent, file: FileItem) => {
    e.stopPropagation();
    setSelected(file);
  };

  const handleRename = () => {
    if (!newName.trim()) return;
    setFiles(prev => prev.map(f => f.id === selected?.id ? { ...f, name: newName } : f));
    setModal(null);
    setNewName('');
  };

  const handleDelete = () => {
    setFiles(prev => prev.filter(f => f.id !== selected?.id));
    setModal(null);
    setSelected(null);
  };

  const handleNewFolder = () => {
    if (!newName.trim()) return;
    const folder: FileItem = {
      id: Date.now().toString(),
      name: newName,
      type: 'folder',
      date: 'Только что',
      icon: 'Folder',
      color: '#1a8fff',
    };
    setFiles(prev => [folder, ...prev]);
    setModal(null);
    setNewName('');
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const newFiles: FileItem[] = Array.from(target.files || []).map(f => ({
        id: Date.now() + f.name,
        name: f.name,
        type: 'file' as const,
        size: f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} МБ` : `${(f.size / 1024).toFixed(0)} КБ`,
        date: 'Только что',
        icon: f.type.startsWith('image/') ? 'Image' : f.type.includes('pdf') ? 'FileText' : 'File',
        color: f.type.startsWith('image/') ? '#ec4899' : f.type.includes('pdf') ? '#ef4444' : '#1a8fff',
      }));
      setFiles(prev => [...newFiles, ...prev]);
    };
    input.click();
  };

  const handleDownload = (file: FileItem) => {
    const a = document.createElement('a');
    a.href = '#';
    a.download = file.name;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background bg-grid pb-24">
      <div className="px-4 pt-12 pb-4 sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-[rgba(26,143,255,0.1)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {path.length > 0 && (
              <button onClick={() => setPath(prev => prev.slice(0, -1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
                <Icon name="ArrowLeft" size={16} className="text-foreground" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {path.length === 0 ? 'Хранилище' : path[path.length - 1]}
              </h1>
              {path.length > 0 && (
                <p className="text-xs text-muted-foreground">{['Корень', ...path].join(' / ')}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setView(v => v === 'list' ? 'grid' : 'list')}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground">
              <Icon name={view === 'list' ? 'Grid3X3' : 'List'} size={16} />
            </button>
            <button onClick={() => { setModal('new-folder'); setNewName(''); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground">
              <Icon name="FolderPlus" size={16} />
            </button>
            <button onClick={handleUpload}
              className="neon-btn px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5">
              <Icon name="Upload" size={13} />
              Загрузить
            </button>
          </div>
        </div>

        <div className="relative">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="neon-input w-full rounded-xl pl-9 pr-4 py-2 text-sm"
            placeholder="Поиск файлов..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      <div className="px-4 pt-4">
        {view === 'list' ? (
          <div className="space-y-2">
            {filtered.map((file, i) => (
              <div key={file.id}
                className={`file-item animate-fade-in delay-${Math.min(i * 50, 400)}`}
                onClick={() => file.type === 'folder' && setPath(prev => [...prev, file.name])}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${file.color}20` }}>
                  <Icon name={file.icon} size={20} style={{ color: file.color }} fallback="File" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.type === 'folder' ? 'Папка' : file.size} · {file.date}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {file.type === 'file' && (
                    <button onClick={e => { e.stopPropagation(); handleDownload(file); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-neon hover:bg-[rgba(26,143,255,0.1)] transition-all">
                      <Icon name="Download" size={14} />
                    </button>
                  )}
                  <button onClick={e => openMenu(e, file)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                    onClickCapture={e => { openMenu(e, file); setModal('options' as ModalType); }}>
                    <Icon name="MoreVertical" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((file, i) => (
              <div key={file.id}
                className={`glass-card rounded-xl p-3 cursor-pointer hover:border-[rgba(26,143,255,0.4)] transition-all animate-fade-in`}
                onClick={() => file.type === 'folder' && setPath(prev => [...prev, file.name])}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2"
                  style={{ background: `${file.color}20` }}>
                  <Icon name={file.icon} size={24} style={{ color: file.color }} fallback="File" />
                </div>
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {file.type === 'folder' ? 'Папка' : file.size}
                </p>
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <Icon name="FolderOpen" size={48} className="text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground">Ничего не найдено</p>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full glass-card rounded-t-3xl p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${selected.color}20` }}>
                <Icon name={selected.icon} size={20} style={{ color: selected.color }} fallback="File" />
              </div>
              <div>
                <p className="font-semibold text-foreground truncate max-w-[200px]">{selected.name}</p>
                <p className="text-xs text-muted-foreground">{selected.size || 'Папка'} · {selected.date}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {selected.type === 'file' && (
                <button onClick={() => handleDownload(selected)}
                  className="flex items-center gap-2 p-3 rounded-xl hover:bg-secondary transition-colors text-sm text-foreground">
                  <Icon name="Download" size={16} className="text-neon" />
                  Скачать
                </button>
              )}
              <button onClick={() => { setModal('rename'); setNewName(selected.name); }}
                className="flex items-center gap-2 p-3 rounded-xl hover:bg-secondary transition-colors text-sm text-foreground">
                <Icon name="Pencil" size={16} className="text-neon-cyan" />
                Переименовать
              </button>
              <button onClick={() => setModal('copy')}
                className="flex items-center gap-2 p-3 rounded-xl hover:bg-secondary transition-colors text-sm text-foreground">
                <Icon name="Copy" size={16} className="text-[#a855f7]" />
                Копировать в...
              </button>
              <button onClick={() => setModal('delete')}
                className="flex items-center gap-2 p-3 rounded-xl hover:bg-secondary transition-colors text-sm text-red-400">
                <Icon name="Trash2" size={16} />
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'rename' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" onClick={() => setModal(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative glass-card rounded-2xl p-6 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-foreground mb-4">Переименовать</h3>
            <input className="neon-input w-full rounded-xl px-4 py-2.5 text-sm mb-4"
              value={newName} onChange={e => setNewName(e.target.value)}
              autoFocus onKeyDown={e => e.key === 'Enter' && handleRename()} />
            <div className="flex gap-2">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Отмена</button>
              <button onClick={handleRename} className="flex-1 neon-btn rounded-xl py-2.5 text-sm">Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'copy' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" onClick={() => setModal(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative glass-card rounded-2xl p-6 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-foreground mb-4">Копировать в папку</h3>
            <div className="space-y-2 mb-4">
              {files.filter(f => f.type === 'folder').map(folder => (
                <button key={folder.id}
                  onClick={() => { setModal(null); setSelected(null); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left">
                  <Icon name="Folder" size={18} style={{ color: folder.color }} />
                  <span className="text-sm text-foreground">{folder.name}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setModal(null)} className="w-full py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Отмена</button>
          </div>
        </div>
      )}

      {modal === 'delete' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" onClick={() => setModal(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative glass-card rounded-2xl p-6 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-red-500/15 mx-auto mb-4">
              <Icon name="Trash2" size={22} className="text-red-400" />
            </div>
            <h3 className="font-bold text-foreground text-center mb-2">Удалить {selected?.type === 'folder' ? 'папку' : 'файл'}?</h3>
            <p className="text-sm text-muted-foreground text-center mb-5">«{selected?.name}» будет удалён без возможности восстановления.</p>
            <div className="flex gap-2">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Отмена</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-sm font-medium transition-colors">Удалить</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'new-folder' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" onClick={() => setModal(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative glass-card rounded-2xl p-6 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-foreground mb-4">Новая папка</h3>
            <input className="neon-input w-full rounded-xl px-4 py-2.5 text-sm mb-4"
              placeholder="Название папки" value={newName} onChange={e => setNewName(e.target.value)}
              autoFocus onKeyDown={e => e.key === 'Enter' && handleNewFolder()} />
            <div className="flex gap-2">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Отмена</button>
              <button onClick={handleNewFolder} className="flex-1 neon-btn rounded-xl py-2.5 text-sm">Создать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
