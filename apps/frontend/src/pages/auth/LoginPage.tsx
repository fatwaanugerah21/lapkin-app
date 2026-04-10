import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAsyncAction } from '../../hooks/useAsyncAction';

const roleRedirectPath: Record<string, string> = {
  admin: '/admin',
  manager: '/manager',
  pegawai: '/pegawai',
};

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { isLoading, run } = useAsyncAction();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const user = await run(
      () => login(username, password).then(() => useAuthStore.getState().user),
      'Login berhasil',
    );
    if (user) navigate(roleRedirectPath[user.role] ?? '/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
            <span className="text-3xl">📋</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">LAPKIN</h1>
          <p className="text-gray-500 text-sm mt-1">Laporan Kinerja PNS</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="username"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Masukkan username..."
            autoComplete="username"
            required
          />
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan password..."
            autoComplete="current-password"
            required
          />
          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            Masuk
          </Button>
        </form>
      </div>
    </div>
  );
};
