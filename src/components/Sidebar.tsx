import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  Users,
  Receipt,
  UserPlus,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/auth/store';
import { canCreateUsers, personaFor } from '@/lib/roles';

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

export function Sidebar() {
  const session = useAuth((s) => s.session);
  if (!session) return null;
  const persona = personaFor(session.user.role, session.user.program);
  const allowAdmin = canCreateUsers(persona);

  return (
    <aside
      aria-label="Primary"
      className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border-subtle bg-surface-elevated"
    >
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <img
          src="/NEUPAY.png"
          alt="NeuPay"
          className="size-28 rounded-2xl object-contain"
        />
        <div>
          <div className="text-base font-semibold text-text-primary">NeuPay</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
            Cashier Console
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5">
        {ITEMS.filter((it) => !it.adminOnly || allowAdmin).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-800 dark:bg-brand-900/30 dark:text-brand-200'
                  : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary',
              )
            }
          >
            <item.icon className="size-4 shrink-0" aria-hidden />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="m-3 rounded-xl border border-border-subtle bg-surface-canvas/60 p-3">
        <div className="flex items-center gap-2 text-text-tertiary">
          <ShieldCheck className="size-3.5" />
          <span className="text-[10px] uppercase tracking-[0.16em] font-semibold">
            Mediator only
          </span>
        </div>
        <p className="text-[11px] text-text-tertiary mt-2 leading-snug">
          Students &amp; faculty pay only on the mobile app. This dashboard adds funds and reads balances — it never deducts.
        </p>
      </div>
    </aside>
  );
}
