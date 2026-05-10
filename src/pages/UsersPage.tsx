import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Users as UsersIcon,
  UserPlus,
} from 'lucide-react';
import { searchUsers } from '@/api/users';
import { useDebounce } from '@/lib/useDebounce';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Empty, Spinner } from '@/components/ui/Empty';
import { RoleBadge, StatusBadge } from '@/components/RoleBadge';
import { initials } from '@/lib/format';
import type { UserRole } from '@/api/types';
import { usePageHeader } from '@/components/Layout';
import { useAuth } from '@/auth/store';
import { canCreateUsers, personaFor } from '@/lib/roles';

const ROLE_OPTIONS = [
  { value: '',        label: 'All roles' },
  { value: 'STUDENT', label: 'Students' },
  { value: 'FACULTY', label: 'Faculty' },
  { value: 'CASHIER', label: 'Cashiers' },
  { value: 'ADMIN',   label: 'Admins' },
];

export default function UsersPage() {
  const session = useAuth((s) => s.session);
  const persona = session ? personaFor(session.user.role, session.user.program) : 'CASHIER';
  const isAdmin = canCreateUsers(persona);
  const setHeader = usePageHeader((s) => s.set);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const debouncedQuery = useDebounce(query.trim(), 250);

  const list = useQuery({
    queryKey: ['users', debouncedQuery, page],
    queryFn: () => searchUsers(debouncedQuery || undefined, page, 25),
  });

  useEffect(() => {
    setHeader({
      title: 'Users',
      description: 'Search students, faculty, and staff. Cashiers can read; admins manage.',
      actions: isAdmin ? (
        <Link to="/users/new">
          <Button>
            <UserPlus className="size-4" />
            New User
          </Button>
        </Link>
      ) : null,
    });
  }, [setHeader, isAdmin]);

  const filtered = (list.data?.content ?? []).filter(
    (u) => !roleFilter || u.role === roleFilter,
  );

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
          <div className="flex-1">
            <Input
              label="Search"
              placeholder="Name, email, or ID number"
              leftIcon={<Search className="size-4" />}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            />
          </div>
          <div className="md:w-44">
            <Select
              label="Role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
              options={ROLE_OPTIONS}
            />
          </div>
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        {list.isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <Empty
            icon={<UsersIcon className="size-8" />}
            title="No users match"
            description="Try clearing filters or adjusting your search."
            className="py-12"
          />
        ) : (
          <div className="divide-y divide-border-subtle">
            {filtered.map((u) => (
              <button
                key={u.id}
                onClick={() => navigate(`/users/${encodeURIComponent(u.idNumber)}`)}
                className="w-full text-left flex items-center gap-4 px-5 py-3 row-hover"
              >
                <span className="size-10 rounded-xl bg-surface-muted text-text-secondary grid place-items-center text-xs font-bold">
                  {initials(u.fullName)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-text-primary truncate">
                      {u.fullName}
                    </span>
                    <RoleBadge role={u.role} />
                    <StatusBadge status={u.status} />
                  </div>
                  <div className="text-xs text-text-tertiary mt-0.5 truncate">
                    {u.email} · ID {u.idNumber}
                  </div>
                </div>
                <ChevronRight className="size-4 text-text-tertiary shrink-0" />
              </button>
            ))}
          </div>
        )}

        {list.data && list.data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border-subtle px-5 py-3">
            <div className="text-xs text-text-tertiary">
              Showing {filtered.length} of {list.data.totalElements} · page {page + 1} of {list.data.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={list.data.first}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="size-3.5" /> Prev
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={list.data.last}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
