import { api } from './client';
import type { AuthResponse, StepUpResponse } from './types';

export interface LoginInput {
  /** Faculty / staff ID number — emails are no longer accepted. */
  idNumber: string;
  password: string;
}

export async function login({ idNumber, password }: LoginInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', {
    idNumber,
    password,
  });
  return data;
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/refresh', { refreshToken });
  return data;
}

export async function logout(refreshToken: string): Promise<void> {
  await api.post('/auth/logout', { refreshToken });
}

export async function passwordStepUp(password: string): Promise<StepUpResponse> {
  const { data } = await api.post<StepUpResponse>('/auth/step-up/password', { password });
  return data;
}
