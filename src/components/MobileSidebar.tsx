import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { X, LayoutDashboard, Wallet, Users, Receipt, UserPlus, Settings } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { useAuth } from '@/auth/store';
import { canCreateUsers, personaFor } from '@/lib/roles';
import { cn } from '@/lib/cn';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  end?: boolean;
  adminOnly?: boolean;
}

const ITEMS: NavItem[] = [
  { to: '/dashboard',    label: 'Overview',     icon: LayoutDashboard, end: true },
  { to: '/cash-in',      label: 'Cash In',      icon: Wallet },
  { to: '/users',        label: 'Users',        icon: Users },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/users/new',    label: 'New User',     icon: UserPlus, adminOnly: true },
  { to: '/settings',     label: 'Settings',     icon: Settings },
];

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const session = useAuth((s) => s.session);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !session) return null;
  const persona = personaFor(session.user.role, session.user.program);
  const allowAdmin = canCreateUsers(persona);

  return createPortal(
    <div className="fixed inset-0 z-40 lg:hidden">
      <button
        aria-label="Close navigation overlay"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <aside className="relative h-full w-72 bg-surface-elevated border-r border-border-subtle flex flex-col">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <img
              src="/NEUPAY.png"
              alt="NeuPay"
              className="size-12 rounded-xl object-contain shrink-0"
            />
            <div className="text-base font-semibold">NeuPay Console</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-muted">
            <X className="size-4" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5">
          {ITEMS.filter((it) => !it.adminOnly || allowAdmin).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                  isActive
                    ? 'bg-brand-50 text-brand-800 dark:bg-brand-900/30 dark:text-brand-200'
                    : 'text-text-secondary hover:bg-surface-muted',
                )
              }
            >
              <item.icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </div>,
    document.body,
  );
}
