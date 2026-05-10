import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Users,
  TrendingUp,
  Coins,
  ArrowUpRight,
  Receipt,
  Info,
} from 'lucide-react';
import { adminTransactions, cashInStats } from '@/api/transactions';
import { searchUsers } from '@/api/users';
import { Card, Section, StatCard } from '@/components/ui/Card';
import { CashInChart } from '@/components/CashInChart';
import { Empty, Spinner } from '@/components/ui/Empty';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { RoleBadge } from '@/components/RoleBadge';
import { formatPHP, formatRelative } from '@/lib/format';
import { usePageHeader } from '@/components/Layout';
import { useAuth } from '@/auth/store';
import { personaFor, personaLabel, roleLabel } from '@/lib/roles';
import type { UserRole } from '@/api/types';

const RANGE_LABEL: Record<number, string> = {
  7: 'past week',
  14: 'past two weeks',
  30: 'past month',
  90: 'past three months',
};

export default function DashboardPage() {
  const session = useAuth((s) => s.session);
  const setHeader = usePageHeader((s) => s.set);
  const [days, setDays] = useState<number>(30);
  const [metric, setMetric] = useState<'count' | 'amount'>('count');

  useEffect(() => {
    const persona = session ? personaFor(session.user.role, session.user.program) : 'CASHIER';
    setHeader({
      title: `Welcome, ${session?.user.fullName.split(' ')[0] ?? 'there'}`,
      description: `Signed in as ${personaLabel(persona)} • ID ${session?.user.idNumber ?? ''}`,
    });
  }, [session, setHeader]);

  const stats = useQuery({
    queryKey: ['cash-in-stats', days],
    queryFn: () => cashInStats(days),
  });

  const recent = useQuery({
    queryKey: ['admin-transactions', 'TOP_UP', 0, 8],
    queryFn: () => adminTransactions('TOP_UP', 0, 8),
  });

  const users = useQuery({
    queryKey: ['admin-users-summary'],
    queryFn: () => searchUsers(undefined, 0, 1),
  });

  const totals = computeTotals(stats.data?.buckets);
  const rangeLabel = RANGE_LABEL[days] ?? `last ${days} days`;
  const avgPerDay = totals.totalCount === 0 ? 0 : totals.totalCount / days;
  const avgPerTopup = totals.totalCount === 0 ? 0 : totals.totalAmount / totals.totalCount;
  const topShare =
    totals.topRoleAmount > 0 && totals.totalAmount > 0
      ? Math.round((totals.topRoleAmount / totals.totalAmount) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6">
      <Card padding="sm" className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
          <Info className="size-3.5" />
        </span>
        <div className="text-xs text-text-secondary leading-relaxed">
          <span className="font-semibold text-text-primary">What you're seeing</span> — every
          card and chart below is scoped to wallet <span className="font-medium">cash-ins</span> (top-ups)
          across the whole university for the {rangeLabel}. Use the time-range and metric pickers below to change the slice.
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Wallet cash-ins"
          value={totals.totalCount.toLocaleString()}
          hint={
            totals.totalCount === 0
              ? 'No top-ups in this range'
              : `≈ ${avgPerDay.toFixed(avgPerDay < 1 ? 2 : 1)} per day on average`
          }
          icon={<TrendingUp className="size-4" />}
          accent="brand"
        />
        <StatCard
          label="Total money credited"
          value={formatPHP(totals.totalAmount)}
          hint={
            totals.totalCount === 0
              ? 'No transactions yet'
              : `Average top-up · ${formatPHP(avgPerTopup)}`
          }
          icon={<Coins className="size-4" />}
          accent="gold"
        />
        <StatCard
          label="Largest recipient group"
          value={totals.topRole ? roleLabel(totals.topRole) : '—'}
          hint={
            totals.topRole
              ? `${formatPHP(totals.topRoleAmount)} received · ${topShare}% of all credits`
              : 'No activity yet'
          }
          icon={<Wallet className="size-4" />}
          accent="emerald"
        />
        <StatCard
          label="Registered users on platform"
          value={users.data ? users.data.totalElements.toLocaleString() : '—'}
          hint={`${totals.uniqueRoles} role${totals.uniqueRoles === 1 ? '' : 's'} active in this range`}
          icon={<Users className="size-4" />}
          accent="rose"
        />
      </div>

      <Section
        title="Cash-ins by recipient role"
        description={
          metric === 'count'
            ? `How many top-ups each group received over the ${rangeLabel}.`
            : `How much money each group received over the ${rangeLabel}.`
        }
        trailing={
          <div className="flex items-center gap-2">
            <Select
              aria-label="Metric"
              value={metric}
              onChange={(e) => setMetric(e.target.value as 'count' | 'amount')}
              options={[
                { value: 'count',  label: 'Show count' },
                { value: 'amount', label: 'Show pesos' },
              ]}
              className="w-36"
            />
            <Select
              aria-label="Time range"
              value={String(days)}
              onChange={(e) => setDays(Number(e.target.value))}
              options={[
                { value: '7',  label: 'Past week' },
                { value: '14', label: 'Past 2 weeks' },
                { value: '30', label: 'Past month' },
                { value: '90', label: 'Past 3 months' },
              ]}
              className="w-36"
            />
          </div>
        }
      >
        <CashInChart data={stats.data} isLoading={stats.isLoading} metric={metric} />
        {totals.byRole.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {totals.byRole.map((r) => (
              <div
                key={r.role}
                className="rounded-lg border border-border-subtle/60 px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <RoleBadge role={r.role} />
                  <span className="text-[11px] font-semibold text-text-tertiary tabular-nums">
                    {totals.totalAmount > 0
                      ? `${Math.round((r.amount / totals.totalAmount) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="text-sm font-bold text-text-primary tabular-nums mt-1">
                  {formatPHP(r.amount)}
                </div>
                <div className="text-[11px] text-text-tertiary">
                  {r.count.toLocaleString()} top-up{r.count === 1 ? '' : 's'}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Recent cash-ins"
        description="The 8 most recent wallet credits — see who was credited, who cashed it in, and when."
        trailing={
          <Link to="/transactions">
            <Button variant="ghost" size="sm">
              View all
              <ArrowUpRight className="size-3.5" />
            </Button>
          </Link>
        }
      >
        {recent.isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : !recent.data || recent.data.items.length === 0 ? (
          <Empty
            icon={<Receipt className="size-8" />}
            title="No cash-ins yet"
            description="Once cashiers credit wallets through the dashboard or iOS app, they'll show up here."
            action={<Link to="/cash-in"><Button>Go to Cash In</Button></Link>}
          />
        ) : (
          <div className="divide-y divide-border-subtle -mx-2">
            {recent.data.items.map((t) => (
              <div key={t.id} className="flex items-center gap-4 px-2 py-3 row-hover rounded-lg">
                <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 grid place-items-center">
                  <Coins className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-text-primary truncate max-w-[28ch]">
                      {t.recipientName}
                    </span>
                    <RoleBadge role={t.recipientRole} />
                  </div>
                  <div className="text-xs text-text-tertiary mt-0.5">
                    {t.title}
                    {t.cashierName && (
                      <>
                        <span className="mx-1.5">·</span>
                        Cashed in by <span className="text-text-secondary font-medium">{t.cashierName}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {formatPHP(t.amount)}
                  </div>
                  <div className="text-[11px] text-text-tertiary">
                    {formatRelative(t.occurredAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Card className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm font-semibold text-text-primary">Need to credit a wallet?</div>
          <div className="text-xs text-text-tertiary mt-1">
            Open the Cash In tool. You can either scan a CASH_IN QR or top up directly with password verification.
          </div>
        </div>
        <Link to="/cash-in"><Button>Cash In a Wallet</Button></Link>
      </Card>
    </div>
  );
}

interface RoleTotal { role: UserRole; count: number; amount: number; }

function computeTotals(buckets: { role: string; count: number; totalAmount: string }[] | undefined) {
  let totalCount = 0;
  let totalAmount = 0;
  const byRoleMap = new Map<UserRole, RoleTotal>();
  for (const b of buckets ?? []) {
    const role = b.role as UserRole;
    totalCount += b.count;
    const amt = Number(b.totalAmount);
    totalAmount += amt;
    const cur = byRoleMap.get(role) ?? { role, count: 0, amount: 0 };
    byRoleMap.set(role, { role, count: cur.count + b.count, amount: cur.amount + amt });
  }
  let topRole: UserRole | null = null;
  let topAmount = 0;
  byRoleMap.forEach((v, k) => {
    if (v.amount > topAmount) {
      topAmount = v.amount;
      topRole = k;
    }
  });
  const byRole = Array.from(byRoleMap.values()).sort((a, b) => b.amount - a.amount);
  return {
    totalCount,
    totalAmount,
    topRole,
    topRoleAmount: topAmount,
    uniqueRoles: byRoleMap.size,
    byRole,
  };
}
