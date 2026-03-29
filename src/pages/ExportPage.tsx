import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { exportVault, importVault } from '@/lib/crypto';
import { getAllFiles, getAllFolders, loadAccount, importFiles, importFolders, saveAccount } from '@/lib/db';
import type { EncryptedFile, Folder, LocalAccount } from '@/lib/db';

interface ExportPageProps {
  onBack: () => void;
  onImportComplete: () => void;
}

type Tab = 'export' | 'import';
type ExportStep = 'idle' | 'confirm' | 'password' | 'processing' | 'done';
type ImportStep = 'idle' | 'file-picked' | 'password' | 'processing' | 'done' | 'error';

interface VaultPayload {
  version: number;
  exportedAt: number;
  account: LocalAccount;
  files: EncryptedFile[];
  folders: Folder[];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} КБ`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} МБ`;
  return `${(bytes / 1073741824).toFixed(2)} ГБ`;
}

export default function ExportPage({ onBack, onImportComplete }: ExportPageProps) {
  const [tab, setTab] = useState<Tab>('export');

  // Export state
  const [exportStep, setExportStep] = useState<ExportStep>('idle');
  const [exportPassword, setExportPassword] = useState('');
  const [exportShowPass, setExportShowPass] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [exportInfo, setExportInfo] = useState<{ files: number; folders: number; size: number } | null>(null);
  const [exportError, setExportError] = useState('');

  // Import state
  const [importStep, setImportStep] = useState<ImportStep>('idle');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPassword, setImportPassword] = useState('');
  const [importShowPass, setImportShowPass] = useState(false);
  const [importError, setImportError] = useState('');
  const [importInfo, setImportInfo] = useState<{ files: number; folders: number } | null>(null);
  const [importProgress, setImportProgress] = useState('');

  const handleStartExport = async () => {
    const [files, folders] = await Promise.all([getAllFiles(), getAllFolders()]);
    const totalSize = files.reduce((s, f) => s + f.size, 0);
    setExportInfo({ files: files.length, folders: folders.length, size: totalSize });
    setExportStep('confirm');
  };

  const handleExport = async () => {
    if (!exportPassword) { setExportError('Введите пароль для архива'); return; }
    setExportError('');
    setExportStep('processing');
    try {
      setExportProgress('Собираем файлы...');
      const [files, folders] = await Promise.all([getAllFiles(), getAllFolders()]);
      const account = loadAccount();

      setExportProgress('Шифруем архив (AES-GCM 256)...');
      const payload: VaultPayload = {
        version: 1,
        exportedAt: Date.now(),
        account: account!,
        files,
        folders,
      };
      const blob = await exportVault(exportPassword, payload);

      setExportProgress('Сохраняем файл...');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `novadrive-backup-${date}.ndrive`;
      a.click();
      URL.revokeObjectURL(url);

      setExportStep('done');
    } catch (e) {
      setExportError('Ошибка при создании архива');
      setExportStep('password');
    }
  };

  const handlePickImportFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ndrive';
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) {
        setImportFile(f);
        setImportStep('file-picked');
        setImportError('');
      }
    };
    input.click();
  };

  const handleImport = async () => {
    if (!importFile || !importPassword) { setImportError('Введите пароль архива'); return; }
    setImportError('');
    setImportStep('processing');
    try {
      setImportProgress('Читаем архив...');
      const buffer = await importFile.arrayBuffer();

      setImportProgress('Расшифровываем (AES-GCM 256)...');
      const payload = await importVault(importPassword, buffer) as VaultPayload;

      if (!payload.files || !payload.folders) {
        throw new Error('Повреждённый архив: отсутствуют данные.');
      }

      setImportProgress(`Импортируем ${payload.files.length} файлов...`);
      await importFiles(payload.files);

      setImportProgress(`Импортируем ${payload.folders.length} папок...`);
      await importFolders(payload.folders);

      if (payload.account && !loadAccount()) {
        saveAccount(payload.account);
      }

      setImportInfo({ files: payload.files.length, folders: payload.folders.length });
      setImportStep('done');
    } catch (e: unknown) {
      setImportError(e instanceof Error ? e.message : 'Ошибка импорта');
      setImportStep('error');
    }
  };

  const resetExport = () => {
    setExportStep('idle');
    setExportPassword('');
    setExportError('');
  };

  const resetImport = () => {
    setImportStep('idle');
    setImportFile(null);
    setImportPassword('');
    setImportError('');
  };

  return (
    <div className="min-h-screen bg-background bg-grid pb-24">
      <div className="px-4 pt-12 pb-4 sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-[rgba(26,143,255,0.1)]">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-secondary transition-colors">
            <Icon name="ArrowLeft" size={18} className="text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Перенос хранилища</h1>
            <p className="text-xs text-muted-foreground">Экспорт и импорт зашифрованного архива</p>
          </div>
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-secondary">
          {(['export', 'import'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {t === 'export' ? 'Экспорт' : 'Импорт'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-6">
        {tab === 'export' && (
          <div className="animate-fade-in">
            {exportStep === 'idle' && (
              <>
                <div className="glass-card rounded-2xl p-5 mb-5"
                  style={{ background: 'linear-gradient(135deg, rgba(26,143,255,0.08) 0%, rgba(0,212,255,0.04) 100%)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(26,143,255,0.15)', border: '1px solid rgba(26,143,255,0.3)' }}>
                      <Icon name="PackageOpen" size={22} className="text-neon" fallback="Archive" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Зашифрованный архив</p>
                      <p className="text-xs text-muted-foreground">Файл формата .ndrive</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { icon: 'Shield', text: 'Все файлы зашифрованы AES-GCM 256-bit' },
                      { icon: 'Key', text: 'Защищён паролем, который знаете только вы' },
                      { icon: 'Smartphone', text: 'Работает на любом устройстве с NovaDrive' },
                      { icon: 'WifiOff', text: 'Никакой передачи данных по сети' },
                    ].map(item => (
                      <div key={item.text} className="flex items-center gap-2.5">
                        <Icon name={item.icon} size={14} className="text-neon flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={handleStartExport}
                  className="neon-btn w-full rounded-2xl py-4 text-base font-semibold flex items-center justify-center gap-3">
                  <Icon name="Download" size={20} />
                  Экспортировать хранилище
                </button>
              </>
            )}

            {exportStep === 'confirm' && exportInfo && (
              <div className="animate-scale-in">
                <div className="glass-card rounded-2xl p-5 mb-5">
                  <p className="text-sm font-semibold text-foreground mb-4">Содержимое архива</p>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'Файлов', value: exportInfo.files.toString(), icon: 'Files' },
                      { label: 'Папок', value: exportInfo.folders.toString(), icon: 'FolderOpen' },
                      { label: 'Размер', value: formatSize(exportInfo.size), icon: 'HardDrive' },
                    ].map(s => (
                      <div key={s.label} className="text-center p-3 rounded-xl bg-secondary">
                        <Icon name={s.icon} size={16} className="text-neon mx-auto mb-1" />
                        <p className="text-sm font-bold text-foreground mono">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-5 mb-5">
                  <p className="text-sm font-semibold text-foreground mb-1">Пароль архива</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Запомните его — без пароля импорт невозможен
                  </p>
                  <div className="relative">
                    <Icon name="Lock" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      className="neon-input w-full rounded-xl pl-9 pr-10 py-2.5 text-sm"
                      type={exportShowPass ? 'text' : 'password'}
                      placeholder="Пароль для архива"
                      value={exportPassword}
                      onChange={e => setExportPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleExport()}
                      autoFocus
                    />
                    <button onClick={() => setExportShowPass(!exportShowPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <Icon name={exportShowPass ? 'EyeOff' : 'Eye'} size={16} />
                    </button>
                  </div>
                  {exportError && (
                    <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                      <Icon name="AlertCircle" size={13} className="text-red-400 flex-shrink-0" />
                      <p className="text-xs text-red-400">{exportError}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={resetExport}
                    className="flex-1 py-3 rounded-2xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Отмена
                  </button>
                  <button onClick={handleExport}
                    className="flex-1 neon-btn rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-2">
                    <Icon name="Download" size={16} />
                    Скачать архив
                  </button>
                </div>
              </div>
            )}

            {exportStep === 'processing' && (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'rgba(26,143,255,0.15)', boxShadow: 'var(--neon-glow)' }}>
                  <Icon name="Lock" size={28} className="text-neon animate-pulse" />
                </div>
                <p className="text-base font-semibold text-foreground mb-2">{exportProgress}</p>
                <p className="text-xs text-muted-foreground mb-6">Пожалуйста, не закрывайте страницу</p>
                <div className="h-1.5 bg-[rgba(26,143,255,0.12)] rounded-full overflow-hidden max-w-xs mx-auto">
                  <div className="progress-neon h-full rounded-full animate-pulse" style={{ width: '70%' }} />
                </div>
              </div>
            )}

            {exportStep === 'done' && (
              <div className="animate-scale-in">
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                    <Icon name="CheckCircle" size={28} className="text-green-400" />
                  </div>
                  <p className="text-xl font-bold text-foreground mb-2">Архив создан!</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Файл <span className="mono text-neon">.ndrive</span> сохранён на вашем устройстве
                  </p>
                </div>
                <div className="glass-card rounded-2xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Icon name="Info" size={16} className="text-[#1a8fff] flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Для импорта на другом устройстве:</p>
                      <p className="text-xs text-muted-foreground">1. Откройте NovaDrive → Перенос → Импорт</p>
                      <p className="text-xs text-muted-foreground">2. Выберите файл <span className="mono text-neon">.ndrive</span></p>
                      <p className="text-xs text-muted-foreground">3. Введите пароль от этого архива</p>
                    </div>
                  </div>
                </div>
                <button onClick={resetExport}
                  className="w-full py-3 rounded-2xl border border-[rgba(26,143,255,0.3)] text-[#1a8fff] text-sm hover:bg-[rgba(26,143,255,0.08)] transition-all">
                  Создать ещё один архив
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'import' && (
          <div className="animate-fade-in">
            {importStep === 'idle' && (
              <>
                <div className="glass-card rounded-2xl p-5 mb-5"
                  style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.06) 0%, rgba(26,143,255,0.04) 100%)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)' }}>
                      <Icon name="Upload" size={22} className="text-neon-cyan" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Восстановить из архива</p>
                      <p className="text-xs text-muted-foreground">Файл .ndrive с другого устройства</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)]">
                    <div className="flex items-start gap-2">
                      <Icon name="AlertTriangle" size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-300/80">
                        Импорт добавит файлы к существующим. Дубликаты перезапишутся по ID.
                      </p>
                    </div>
                  </div>
                </div>
                <button onClick={handlePickImportFile}
                  className="w-full rounded-2xl py-12 border-2 border-dashed border-[rgba(26,143,255,0.25)] hover:border-[rgba(26,143,255,0.5)] hover:bg-[rgba(26,143,255,0.04)] transition-all flex flex-col items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(26,143,255,0.12)' }}>
                    <Icon name="FolderOpen" size={22} className="text-neon" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Выбрать .ndrive файл</p>
                    <p className="text-xs text-muted-foreground mt-1">Нажмите для открытия</p>
                  </div>
                </button>
              </>
            )}

            {(importStep === 'file-picked' || importStep === 'error') && importFile && (
              <div className="animate-scale-in">
                <div className="glass-card rounded-2xl p-4 mb-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(26,143,255,0.15)' }}>
                    <Icon name="FileArchive" size={18} className="text-neon" fallback="File" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{importFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(importFile.size)}</p>
                  </div>
                  <button onClick={resetImport} className="text-muted-foreground hover:text-foreground p-1">
                    <Icon name="X" size={16} />
                  </button>
                </div>

                <div className="glass-card rounded-2xl p-5 mb-5">
                  <p className="text-sm font-semibold text-foreground mb-1">Пароль архива</p>
                  <p className="text-xs text-muted-foreground mb-3">Тот пароль, который вы задали при экспорте</p>
                  <div className="relative">
                    <Icon name="Lock" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      className="neon-input w-full rounded-xl pl-9 pr-10 py-2.5 text-sm"
                      type={importShowPass ? 'text' : 'password'}
                      placeholder="Пароль архива"
                      value={importPassword}
                      onChange={e => setImportPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleImport()}
                      autoFocus
                    />
                    <button onClick={() => setImportShowPass(!importShowPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <Icon name={importShowPass ? 'EyeOff' : 'Eye'} size={16} />
                    </button>
                  </div>
                  {importError && (
                    <div className="flex items-center gap-2 mt-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                      <Icon name="AlertCircle" size={13} className="text-red-400 flex-shrink-0" />
                      <p className="text-xs text-red-400">{importError}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={resetImport}
                    className="flex-1 py-3 rounded-2xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Отмена
                  </button>
                  <button onClick={handleImport}
                    className="flex-1 neon-btn rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-2">
                    <Icon name="Upload" size={16} />
                    Импортировать
                  </button>
                </div>
              </div>
            )}

            {importStep === 'processing' && (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'rgba(0,212,255,0.15)', boxShadow: '0 0 30px rgba(0,212,255,0.3)' }}>
                  <Icon name="Unlock" size={28} className="text-neon-cyan animate-pulse" />
                </div>
                <p className="text-base font-semibold text-foreground mb-2">{importProgress}</p>
                <p className="text-xs text-muted-foreground mb-6">Пожалуйста, не закрывайте страницу</p>
                <div className="h-1.5 bg-[rgba(0,212,255,0.12)] rounded-full overflow-hidden max-w-xs mx-auto">
                  <div className="h-full rounded-full animate-pulse"
                    style={{ width: '60%', background: 'linear-gradient(90deg, #1a8fff, #00d4ff)', boxShadow: '0 0 8px rgba(0,212,255,0.6)' }} />
                </div>
              </div>
            )}

            {importStep === 'done' && importInfo && (
              <div className="animate-scale-in">
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                    <Icon name="CheckCircle" size={28} className="text-green-400" />
                  </div>
                  <p className="text-xl font-bold text-foreground mb-2">Импорт завершён!</p>
                  <p className="text-sm text-muted-foreground">
                    Добавлено <span className="text-neon font-semibold">{importInfo.files}</span> файлов
                    и <span className="text-neon font-semibold">{importInfo.folders}</span> папок
                  </p>
                </div>
                <button onClick={onImportComplete}
                  className="w-full neon-btn rounded-2xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2">
                  <Icon name="HardDrive" size={16} />
                  Перейти в хранилище
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
