// src/app/admin/page.tsx
import { cookies } from 'next/headers';
import LoginForm from '@/components/admin/LoginForm';
import Dashboard from '@/components/admin/Dashboard';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAuth = cookieStore.get('admin_auth')?.value === 'true';

  if (!isAuth) {
    return <LoginForm />;
  }

  return <Dashboard />;
}
