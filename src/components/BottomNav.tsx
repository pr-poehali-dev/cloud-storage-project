import Icon from '@/components/ui/icon';

type Page = 'home' | 'storage' | 'profile' | 'security';

interface BottomNavProps {
  current: Page;
  onChange: (page: Page) => void;
}

const items = [
  { id: 'home' as Page, label: 'Главная', icon: 'LayoutDashboard' },
  { id: 'storage' as Page, label: 'Хранилище', icon: 'HardDrive' },
  { id: 'profile' as Page, label: 'Профиль', icon: 'User' },
  { id: 'security' as Page, label: 'Безопасность', icon: 'ShieldCheck' },
];

export default function BottomNav({ current, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-[rgba(26,143,255,0.15)] px-2 pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`nav-item flex-1 ${current === item.id ? 'active' : ''}`}
          >
            <Icon name={item.icon} size={22} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
