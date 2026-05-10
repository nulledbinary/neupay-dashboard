import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { IdCard, Lock } from 'lucide-react';
import { useAuth } from '@/auth/store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { isStaffRole } from '@/lib/roles';

const APP_NAME = import.meta.env.VITE_NEU_APP_NAME ?? 'NeuPay Dashboard';
const ENV_LABEL = import.meta.env.VITE_NEU_ENV_LABEL ?? '';

export default function LoginPage() {
  const session = useAuth((s) => s.session);
  const signIn = useAuth((s) => s.signIn);
  const loading = useAuth((s) => s.loading);
  const error = useAuth((s) => s.loginError);

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard';

  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  if (session && isStaffRole(session.user.role)) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    try {
      await signIn(idNumber.trim(), password);
      const next = useAuth.getState().session;
      if (next && !isStaffRole(next.user.role)) {
        await useAuth.getState().signOut();
        setLocalError('This account is mobile-only. The dashboard is reserved for staff.');
        return;
      }
      navigate(from, { replace: true });
    } catch {
      // store already populated `loginError`
    }
  };

  const shownError = localError ?? error;

  return (
    <div className="relative min-h-full flex items-center justify-center overflow-hidden bg-surface-canvas px-4 py-10">
      {/* Animated background — gradient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 size-[28rem] rounded-full bg-brand-500/30 blur-3xl login-blob" />
        <div className="absolute top-1/3 -right-40 size-[32rem] rounded-full bg-gold-500/25 blur-3xl login-blob-slow" />
        <div className="absolute -bottom-40 left-1/4 size-[26rem] rounded-full bg-brand-700/30 blur-3xl login-blob" />
        <div
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,0,0,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.45) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 75%)',
          }}
        />
      </div>

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md login-fade-up">
        <div className="card border-border-subtle/60 bg-surface-elevated/80 backdrop-blur-xl shadow-[0_24px_60px_-20px_rgba(8,51,68,0.45)] p-8 sm:p-10">
          <div className="flex flex-col items-center text-center">
            <div className="size-14 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 grid place-items-center text-gold-400 font-bold text-lg shadow-lg shadow-brand-900/30 ring-1 ring-white/10">
              NEU
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight login-shimmer-text">
              {APP_NAME}
            </h1>
            <p className="mt-1.5 text-sm text-text-tertiary">
              Sign in to continue to your dashboard.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
            <Input
              label="Username"
              placeholder="Username"
              autoComplete="username"
              inputMode="text"
              required
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              leftIcon={<IdCard className="size-4" />}
            />
            <Input
              label="Password"
              placeholder="Password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="size-4" />}
            />
            {shownError && (
              <div
                role="alert"
                className="text-xs rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 px-3 py-2"
              >
                {shownError}
              </div>
            )}
            <Button type="submit" loading={loading} fullWidth size="lg">
              Sign in
            </Button>
          </form>

          {ENV_LABEL && (
            <p className="mt-6 text-center text-[11px] text-text-tertiary">
              Environment:{' '}
              <span className="font-semibold text-brand-700 dark:text-brand-300">
                {ENV_LABEL}
              </span>
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-text-tertiary">
          Session ends when you close the tab.
        </p>
      </div>
    </div>
  );
}
