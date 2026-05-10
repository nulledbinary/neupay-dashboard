import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Spinner } from '@/components/ui/Empty';
import { Layout } from '@/components/Layout';
import { RouteGuard } from '@/auth/RouteGuard';
import { ToastViewport } from '@/components/ui/Toast';

const LoginPage         = lazy(() => import('@/pages/LoginPage'));
const DashboardPage     = lazy(() => import('@/pages/DashboardPage'));
const CashInPage        = lazy(() => import('@/pages/CashInPage'));
const UsersPage         = lazy(() => import('@/pages/UsersPage'));
const UserDetailPage    = lazy(() => import('@/pages/UserDetailPage'));
const NewUserPage       = lazy(() => import('@/pages/NewUserPage'));
const TransactionsPage  = lazy(() => import('@/pages/TransactionsPage'));
const SettingsPage      = lazy(() => import('@/pages/SettingsPage'));

function PageFallback() {
  return (
    <div className="min-h-full flex items-center justify-center">
      <Spinner className="size-6" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route
          path="/login"
          element={
            <>
              <LoginPage />
              <ToastViewport />
            </>
          }
        />

        <Route element={<RouteGuard><Layout /></RouteGuard>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/cash-in" element={<CashInPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:idNumber" element={<UserDetailPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Admin-only routes are guarded twice: once by Layout's RouteGuard
            (any staff) and once by adminOnly here. */}
        <Route element={<RouteGuard adminOnly><Layout /></RouteGuard>}>
          <Route path="/users/new" element={<NewUserPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
