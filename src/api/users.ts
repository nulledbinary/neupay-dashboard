import { api } from './client';
import type {
  ChangeRoleRequest,
  CreateUserRequest,
  SpringPage,
  UserDetails,
  UserRole,
  UserSummary,
  WalletView,
} from './types';

export async function searchUsers(
  q: string | undefined,
  page = 0,
  size = 25,
): Promise<SpringPage<UserSummary>> {
  const { data } = await api.get<SpringPage<UserSummary>>('/admin/users', {
    params: { q: q || undefined, page, size },
  });
  return data;
}

export async function userDetails(id: string): Promise<UserDetails> {
  const { data } = await api.get<UserDetails>(`/admin/users/${id}`);
  return data;
}

/** Resolve by the human-readable ID number — used by the dashboard route so URLs never expose UUIDs. */
export async function userByIdNumber(idNumber: string): Promise<UserDetails> {
  const { data } = await api.get<UserDetails>(
    `/admin/users/by-id-number/${encodeURIComponent(idNumber)}`,
  );
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/admin/users/${id}`);
}

export async function userWallet(id: string): Promise<WalletView> {
  const { data } = await api.get<WalletView>(`/admin/users/${id}/wallet`);
  return data;
}

export async function freezeUser(id: string): Promise<UserDetails> {
  const { data } = await api.post<UserDetails>(`/admin/users/${id}/freeze`);
  return data;
}

export async function reinstateUser(id: string): Promise<UserDetails> {
  const { data } = await api.post<UserDetails>(`/admin/users/${id}/reinstate`);
  return data;
}

export async function createUser(req: CreateUserRequest): Promise<UserDetails> {
  const { data } = await api.post<UserDetails>('/admin/users', req);
  return data;
}

export async function changeUserRole(id: string, role: UserRole): Promise<UserDetails> {
  const body: ChangeRoleRequest = { role };
  const { data } = await api.patch<UserDetails>(`/admin/users/${id}/role`, body);
  return data;
}
