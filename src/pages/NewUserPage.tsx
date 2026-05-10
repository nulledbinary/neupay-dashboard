import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  IdCard,
  Mail,
  User,
  Lock,
  ShieldCheck,
  RefreshCw,
  Coins,
  GraduationCap,
} from 'lucide-react';
import { Section } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { createUser } from '@/api/users';
import { usePageHeader } from '@/components/Layout';
import { useAuth } from '@/auth/store';
import { canCreateUsers, personaFor } from '@/lib/roles';
import type { UserRole } from '@/api/types';

const ROLES: Array<{ value: UserRole; label: string }> = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'FACULTY', label: 'Faculty' },
  { value: 'CASHIER', label: 'School Cashier' },
  { value: 'ADMIN',   label: 'Administrator' },
];

function generatePassword(): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const buf = crypto.getRandomValues(new Uint32Array(16));
  let out = '';
  for (let i = 0; i < buf.length; i++) out += charset[buf[i] % charset.length];
  return out;
}

export default function NewUserPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const session = useAuth((s) => s.session);
  const persona = session ? personaFor(session.user.role, session.user.program) : 'CASHIER';
  const setHeader = usePageHeader((s) => s.set);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [program, setProgram] = useState('');
  const [password, setPassword] = useState(generatePassword());
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [initialBalance, setInitialBalance] = useState('');
  const [balanceNote, setBalanceNote] = useState('');

  useEffect(() => {
    setHeader({
      title: 'Create a new user',
      description: 'Provision any role — student, faculty, cashier, or admin. Optional opening balance is recorded in the receipt log.',
    });
  }, [setHeader]);

  useEffect(() => {
    if (!canCreateUsers(persona)) {
      navigate('/dashboard', { replace: true });
    }
  }, [persona, navigate]);

  const create = useMutation({
    mutationFn: () => createUser({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      idNumber: idNumber.trim(),
      temporaryPassword: password,
      role,
      program: program.trim() || null,
      initialBalance: initialBalance.trim() ? initialBalance.trim() : null,
      initialBalanceNote: balanceNote.trim() || null,
    }),
    onSuccess: (created) => {
      const seeded = initialBalance.trim() && Number(initialBalance) > 0;
      toast.success(
        seeded
          ? `${created.fullName} created with ₱${Number(initialBalance).toLocaleString('en-PH', { minimumFractionDigits: 2 })} opening balance.`
          : `${created.fullName} created as ${role}.`,
      );
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['admin-transactions'] });
      navigate(`/users/${encodeURIComponent(created.idNumber)}`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Could not create the user.';
      toast.error(msg);
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !idNumber || password.length < 12) return;
    if (initialBalance && Number(initialBalance) < 0) return;
    create.mutate();
  };

  const showProgram = role === 'STUDENT' || role === 'FACULTY';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] gap-6">
      <Section title="New user account" description="Choose a role, set credentials, and optionally seed an opening balance.">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input
            label="Full name"
            required
            placeholder="Maria Soledad Reyes"
            maxLength={160}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={<User className="size-4" />}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              required
              placeholder="m.reyes@example.org"
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="size-4" />}
            />
            <Input
              label="ID number"
              required
              placeholder="NEU-2024-00123"
              minLength={6}
              maxLength={32}
              pattern="[A-Za-z0-9-]+"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              leftIcon={<IdCard className="size-4" />}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              options={ROLES}
            />
            {showProgram ? (
              <Input
                label={role === 'STUDENT' ? 'Program' : 'Department'}
                placeholder={role === 'STUDENT' ? 'BS Computer Science' : 'College of Computer Studies'}
                maxLength={160}
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                leftIcon={<GraduationCap className="size-4" />}
              />
            ) : (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-text-secondary">&nbsp;</span>
                <div className="text-xs text-text-tertiary rounded-xl border border-border-subtle bg-surface-canvas/60 px-3 py-2.5">
                  Staff users are tagged as “Staff” internally — no program needed.
                </div>
              </div>
            )}
          </div>
          <Input
            label="Temporary password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={12}
            maxLength={128}
            required
            leftIcon={<Lock className="size-4" />}
            hint="Must be at least 12 characters. The user should change this on first login."
            rightSlot={
              <button
                type="button"
                onClick={() => setPassword(generatePassword())}
                className="px-2 py-1 rounded-md text-text-tertiary hover:bg-surface-muted hover:text-text-primary"
                aria-label="Regenerate password"
              >
                <RefreshCw className="size-3.5" />
              </button>
            }
          />
          <div className="rounded-xl border border-dashed border-border-subtle p-3 flex flex-col gap-3">
            <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-text-tertiary">
              Opening balance (optional)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Initial balance (PHP)"
                inputMode="decimal"
                placeholder="0.00"
                pattern="^\d+(\.\d{1,2})?$"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                leftIcon={<Coins className="size-4" />}
                hint="Leave blank for ₱0.00. Logged as a TOP_UP transaction."
              />
              <Input
                label="Note on receipt"
                placeholder={`Opening balance for ${fullName || 'new user'}`}
                maxLength={160}
                value={balanceNote}
                onChange={(e) => setBalanceNote(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" loading={create.isPending} fullWidth size="lg">
            Create user
          </Button>
        </form>
      </Section>

      <Section title="What this does" description="The end-to-end of pressing Create user.">
        <ul className="text-sm text-text-secondary space-y-3">
          <li className="flex gap-2"><ShieldCheck className="size-4 text-brand-500 mt-0.5 shrink-0" />
            <span>Creates the user with the chosen role and a fresh wallet (status <code className="font-mono text-[11px]">ACTIVE</code>).</span>
          </li>
          <li className="flex gap-2"><Coins className="size-4 text-emerald-500 mt-0.5 shrink-0" />
            <span>If a non-zero opening balance is set, credits the new wallet immediately and writes a <code className="font-mono text-[11px]">TOP_UP</code> transaction tied to your operator id.</span>
          </li>
          <li className="flex gap-2"><ShieldCheck className="size-4 text-brand-500 mt-0.5 shrink-0" />
            <span>The opening transaction is visible in the Transactions / receipt log immediately, including before the user themselves signs in.</span>
          </li>
          <li className="flex gap-2"><ShieldCheck className="size-4 text-brand-500 mt-0.5 shrink-0" />
            <span>Audited as <code className="font-mono text-[11px]">USER_CREATE</code> + <code className="font-mono text-[11px]">USER_INITIAL_BALANCE</code>.</span>
          </li>
        </ul>
      </Section>
    </div>
  );
}
