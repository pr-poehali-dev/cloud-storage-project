import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { encryptData, decryptData, bufferToBase64, base64ToBuffer } from '@/lib/crypto';
import {
  saveFile, getFiles, deleteFile, updateFile,
  saveFolder, getFolders, deleteFolder,
  EncryptedFile, Folder
} from '@/lib/db';

interface StoragePageProps {
  cryptoKey: CryptoKey;
}

type ModalType = 'rename' | 'copy' | 'delete' | 'new-folder' | null;
type SelectedItem = { type: 'file'; file: EncryptedFile } | { type: 'folder'; folder: Folder } | null;

function getFileIcon(mime: string): { icon: string; color: string } {
  if (mime.startsWith('image/')) return { icon: 'Image', color: '#ec4899' };
  if (mime.startsWith('video/')) return { icon: 'Video', color: '#a855f7' };
  if (mime.startsWith('audio/')) return { icon: 'Music', color: '#f59e0b' };
  if (mime.includes('pdf')) return { icon: 'FileText', color: '#ef4444' };
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('7z')) return { icon: 'Archive', color: '#8b5cf6' };
  if (mime.includes('sheet') || mime.includes('excel') || mime.includes('csv')) return { icon: 'FileSpreadsheet', color: '#22c55e' };
  if (mime.includes('word') || mime.includes('document')) return { icon: 'FileText', color: '#3b82f6' };
  return { icon: 'File', color: '#1a8fff' };
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} КБ`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} МБ`;
  return `${(bytes / 1073741824).toFixed(2)} ГБ`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'только что';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`;
  return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function StoragePage({ cryptoKey }: StoragePageProps) {
  const [files, setFiles] = useState<EncryptedFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [pathStack, setPathStack] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'Хранилище' }]);
  const [selected, setSelected] = useState<SelectedItem>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [newName, setNewName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [decrypting, setDecrypting] = useState<string | null>(null);

  const currentFolderId = pathStack[pathStack.length - 1].id;

  const loadData = useCallback(async () => {
    const [f, d] = await Promise.all([
      getFiles(currentFolderId),
      getFolders(currentFolderId),
    ]);
    setFiles(f.sort((a, b) => b.createdAt - a.createdAt));
    setFolders(d.sort((a, b) => b.createdAt - a.createdAt));
  }, [currentFolderId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const fileList = Array.from(target.files || []);
      if (!fileList.length) return;
      setUploading(true);
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        setUploadProgress(Math.round(((i) / fileList.length) * 100));
        const buffer = await f.arrayBuffer();
        const { iv, ciphertext } = await encryptData(cryptoKey, buffer);
        const ef: EncryptedFile = {
          id: crypto.randomUUID(),
          name: f.name,
          encryptedName: f.name,
          size: f.size,
          mimeType: f.type || 'application/octet-stream',
          folderId: currentFolderId,
          createdAt: Date.now(),
          iv: bufferToBase64(iv.buffer),
          ciphertext: bufferToBase64(ciphertext),
        };
        await saveFile(ef);
        setUploadProgress(Math.round(((i + 1) / fileList.length) * 100));
      }
      setUploading(false);
      setUploadProgress(0);
      loadData();
    };
    input.click();
  };

  const handleDownload = async (file: EncryptedFile) => {
    setDecrypting(file.id);
    try {
      const iv = new Uint8Array(base64ToBuffer(file.iv));
      const ciphertext = base64ToBuffer(file.ciphertext);
      const decrypted = await decryptData(cryptoKey, iv, ciphertext);
      const blob = new Blob([decrypted], { type: file.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Ошибка расшифровки файла');
    }
    setDecrypting(null);
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (selected.type === 'file') await deleteFile(selected.file.id);
    else await deleteFolder(selected.folder.id);
    setModal(null);
    setSelected(null);
    loadData();
  };

  const handleRename = async () => {
    if (!selected || !newName.trim()) return;
    if (selected.type === 'file') {
      await updateFile({ ...selected.file, name: newName.trim() });
    } else {
      await saveFolder({ ...selected.folder, name: newName.trim() });
    }
    setModal(null);
    setSelected(null);
    setNewName('');
    loadData();
  };

  const handleCopy = async (targetFolderId: string | null) => {
    if (!selected || selected.type !== 'file') return;
    const copy: EncryptedFile = {
      ...selected.file,
      id: crypto.randomUUID(),
      folderId: targetFolderId,
      createdAt: Date.now(),
      name: `${selected.file.name} (копия)`,
    };
    await saveFile(copy);
    setModal(null);
    setSelected(null);
    loadData();
  };

  const handleNewFolder = async () => {
    if (!newName.trim()) return;
    await saveFolder({
      id: crypto.randomUUID(),
      name: newName.trim(),
      parentId: currentFolderId,
      createdAt: Date.now(),
    });
    setModal(null);
    setNewName('');
    loadData();
  };

  const allItems = [
    ...folders.map(f => ({ type: 'folder' as const, folder: f, name: f.name, date: f.createdAt })),
    ...files.map(f => ({ type: 'file' as const, file: f, name: f.name, date: f.createdAt })),
  ].filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-background bg-grid pb-24">
      <div className="px-4 pt-12 pb-4 sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-[rgba(26,143,255,0.1)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 min-w-0">
            {pathStack.length > 1 && (
              <button onClick={() => setPathStack(p => p.slice(0, -1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors flex-shrink-0">
                <Icon name="ArrowLeft" size={16} className="text-foreground" />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">
                {pathStack[pathStack.length - 1].name}
              </h1>
              {pathStack.length > 1 && (
                <p className="text-xs text-muted-foreground truncate">
                  {pathStack.map(p => p.name).join(' / ')}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setView(v => v === 'list' ? 'grid' : 'list')}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
              <Icon name={view === 'list' ? 'Grid3X3' : 'List'} size={16} />
            </button>
            <button onClick={() => { setModal('new-folder'); setNewName(''); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
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
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {uploading && (
        <div className="px-4 pt-3">
          <div className="glass-card rounded-xl p-3 flex items-center gap-3 animate-fade-in">
            <Icon name="Loader2" size={16} className="text-neon animate-spin flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-foreground mb-1">Шифрование и сохранение...</p>
              <div className="h-1 bg-[rgba(26,143,255,0.12)] rounded-full overflow-hidden">
                <div className="progress-neon h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
            <span className="text-xs text-neon mono">{uploadProgress}%</span>
          </div>
        </div>
      )}

      <div className="px-4 pt-4">
        {allItems.length === 0 && !uploading && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(26,143,255,0.08)', border: '1px dashed rgba(26,143,255,0.2)' }}>
              <Icon name="FolderOpen" size={28} className="text-muted-foreground opacity-50" />
            </div>
            <p className="text-muted-foreground text-sm mb-1">
              {searchQuery ? 'Ничего не найдено' : 'Папка пуста'}
            </p>
            {!searchQuery && (
              <button onClick={handleUpload} className="text-xs text-[#1a8fff] hover:underline mt-2 block mx-auto">
                Загрузить первый файл
              </button>
            )}
          </div>
        )}

        {view === 'list' ? (
          <div className="space-y-2">
            {allItems.map((item, i) => {
              if (item.type === 'folder') {
                const folder = item.folder;
                return (
                  <div key={folder.id}
                    className={`file-item animate-fade-in`}
                    style={{ animationDelay: `${i * 30}ms` }}
                    onClick={() => setPathStack(p => [...p, { id: folder.id, name: folder.name }])}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(26,143,255,0.15)' }}>
                      <Icon name="Folder" size={20} className="text-neon" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{folder.name}</p>
                      <p className="text-xs text-muted-foreground">Папка · {timeAgo(folder.createdAt)}</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setSelected({ type: 'folder', folder }); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                      <Icon name="MoreVertical" size={14} />
                    </button>
                  </div>
                );
              } else {
                const file = item.file;
                const { icon, color } = getFileIcon(file.mimeType);
                return (
                  <div key={file.id}
                    className={`file-item animate-fade-in`}
                    style={{ animationDelay: `${i * 30}ms` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}20` }}>
                      <Icon name={icon} size={20} style={{ color }} fallback="File" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(file.size)} · {timeAgo(file.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDownload(file)}
                        disabled={decrypting === file.id}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-neon hover:bg-[rgba(26,143,255,0.1)] transition-all disabled:opacity-50">
                        <Icon name={decrypting === file.id ? 'Loader2' : 'Download'} size={14}
                          className={decrypting === file.id ? 'animate-spin' : ''} />
                      </button>
                      <button onClick={() => setSelected({ type: 'file', file })}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                        <Icon name="MoreVertical" size={14} />
                      </button>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {allItems.map(item => {
              if (item.type === 'folder') {
                const folder = item.folder;
                return (
                  <div key={folder.id}
                    className="glass-card rounded-xl p-3 cursor-pointer hover:border-[rgba(26,143,255,0.4)] transition-all"
                    onClick={() => setPathStack(p => [...p, { id: folder.id, name: folder.name }])}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2"
                      style={{ background: 'rgba(26,143,255,0.15)' }}>
                      <Icon name="Folder" size={24} className="text-neon" />
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{folder.name}</p>
                    <p className="text-xs text-muted-foreground">Папка</p>
                  </div>
                );
              } else {
                const file = item.file;
                const { icon, color } = getFileIcon(file.mimeType);
                return (
                  <div key={file.id}
                    className="glass-card rounded-xl p-3 cursor-pointer hover:border-[rgba(26,143,255,0.4)] transition-all"
                    onClick={() => handleDownload(file)}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2"
                      style={{ background: `${color}20` }}>
                      <Icon name={icon} size={24} style={{ color }} fallback="File" />
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>

      {selected && !modal && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full glass-card rounded-t-3xl p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: selected.type === 'folder' ? 'rgba(26,143,255,0.15)' : `${getFileIcon(selected.type === 'file' ? selected.file.mimeType : '').color}20` }}>
                <Icon
                  name={selected.type === 'folder' ? 'Folder' : getFileIcon(selected.file.mimeType).icon}
                  size={20}
                  style={{ color: selected.type === 'folder' ? '#1a8fff' : getFileIcon(selected.file.mimeType).color }}
                  fallback="File"
                />
              </div>
              <div>
                <p className="font-semibold text-foreground truncate max-w-[240px]">
                  {selected.type === 'folder' ? selected.folder.name : selected.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selected.type === 'folder' ? 'Папка' : formatSize(selected.file.size)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {selected.type === 'file' && (
                <button onClick={() => { handleDownload(selected.file); setSelected(null); }}
                  className="flex items-center gap-2 p-3 rounded-xl hover:bg-secondary transition-colors text-sm text-foreground">
                  <Icon name="Download" size={16} className="text-neon" />
                  Скачать
                </button>
              )}
              <button onClick={() => {
                setNewName(selected.type === 'folder' ? selected.folder.name : selected.file.name);
                setModal('rename');
              }}
                className="flex items-center gap-2 p-3 rounded-xl hover:bg-secondary transition-colors text-sm text-foreground">
                <Icon name="Pencil" size={16} className="text-[#00d4ff]" />
                Переименовать
              </button>
              {selected.type === 'file' && (
                <button onClick={() => setModal('copy')}
                  className="flex items-center gap-2 p-3 rounded-xl hover:bg-secondary transition-colors text-sm text-foreground">
                  <Icon name="Copy" size={16} className="text-[#a855f7]" />
                  Копировать в...
                </button>
              )}
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
              <button onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Отмена</button>
              <button onClick={handleRename}
                className="flex-1 neon-btn rounded-xl py-2.5 text-sm">Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'copy' && selected?.type === 'file' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" onClick={() => setModal(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative glass-card rounded-2xl p-6 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-foreground mb-4">Копировать в папку</h3>
            <div className="space-y-1 mb-4 max-h-48 overflow-y-auto">
              <button onClick={() => handleCopy(null)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left">
                <Icon name="Home" size={18} className="text-neon" />
                <span className="text-sm text-foreground">Корень хранилища</span>
              </button>
              {folders.map(folder => (
                <button key={folder.id} onClick={() => handleCopy(folder.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left">
                  <Icon name="Folder" size={18} className="text-neon" />
                  <span className="text-sm text-foreground">{folder.name}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setModal(null)}
              className="w-full py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Отмена</button>
          </div>
        </div>
      )}

      {modal === 'delete' && selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" onClick={() => setModal(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative glass-card rounded-2xl p-6 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-red-500/15 mx-auto mb-4">
              <Icon name="Trash2" size={22} className="text-red-400" />
            </div>
            <h3 className="font-bold text-foreground text-center mb-2">
              Удалить {selected.type === 'folder' ? 'папку' : 'файл'}?
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-5">
              «{selected.type === 'folder' ? selected.folder.name : selected.file.name}» будет удалён без возможности восстановления.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Отмена</button>
              <button onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-sm font-medium transition-colors">Удалить</button>
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
              <button onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Отмена</button>
              <button onClick={handleNewFolder}
                className="flex-1 neon-btn rounded-xl py-2.5 text-sm">Создать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
