import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { User, CreateUserPayload, UserRole } from '../../types';
import { usersService } from '../../services/users.service';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateUserPayload) => Promise<void>;
  editingUser?: User | null;
  isLoading: boolean;
}

const roleOptions = [
  { value: 'pegawai', label: 'Pegawai' },
  { value: 'manager', label: 'Manajer' },
  { value: 'direktur', label: 'Direktur (satu akun)' },
  { value: 'admin', label: 'Administrator' },
];

interface FormState {
  name: string; nip: string; username: string; password: string;
  role: UserRole; jobTitle: string; managerId: string;
}

const emptyForm = (): FormState => ({
  name: '', nip: '', username: '', password: '',
  role: 'pegawai', jobTitle: '', managerId: '',
});

const userToForm = (user: User): FormState => ({
  name: user.name, nip: user.nip, username: user.username, password: '',
  role: user.role, jobTitle: user.jobTitle, managerId: user.managerId ?? '',
});

export const UserFormModal = ({ isOpen, onClose, onSubmit, editingUser, isLoading }: UserFormModalProps) => {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [managers, setManagers] = useState<{ id: string; name: string; jobTitle: string }[]>([]);

  useEffect(() => {
    setForm(editingUser ? userToForm(editingUser) : emptyForm());
  }, [editingUser, isOpen]);

  useEffect(() => {
    if (isOpen) {
      usersService.getManagers().then(setManagers).catch(() => { });
    }
  }, [isOpen]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    const payload: CreateUserPayload = {
      name: form.name,
      nip: form.nip,
      username: form.username,
      password: form.password,
      role: form.role,
      jobTitle: form.jobTitle,
      ...(form.role === 'pegawai' && form.managerId && { managerId: form.managerId }),
    };
    await onSubmit(payload);
  };

  const managerOptions = managers.map((m) => ({ value: m.id, label: `${m.name} (${m.jobTitle})` }));
  const isEditing = !!editingUser;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Ubah Pengguna' : 'Tambah Pengguna'} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Nama Lengkap" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Nama lengkap..." />
          <Input label="NIP" value={form.nip} onChange={(e) => setField('nip', e.target.value)} placeholder="NIP..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nama pengguna"
            value={form.username}
            onChange={(e) => setField('username', e.target.value)}
            placeholder="Nama pengguna..."
          />
          <Input
            label={isEditing ? 'Kata sandi baru (kosongkan jika tidak diganti)' : 'Kata sandi'}
            type="password"
            value={form.password}
            onChange={(e) => setField('password', e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <Input label="Jabatan" value={form.jobTitle} onChange={(e) => setField('jobTitle', e.target.value)} placeholder="Jabatan..." />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Peran"
            value={form.role}
            onChange={(e) => setField('role', e.target.value as UserRole)}
            options={roleOptions}
          />
          {form.role === 'pegawai' && (
            <Select
              label="Manajer"
              value={form.managerId}
              onChange={(e) => setField('managerId', e.target.value)}
              options={managerOptions}
              placeholder="Pilih manajer..."
            />
          )}
        </div>
        {form.role === 'manager' && (
          <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            Atasan langsung manajer otomatis ditetapkan ke akun Direktur di sistem.
          </p>
        )}
        {form.role === 'direktur' && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Hanya satu akun Direktur yang boleh ada. Atasan langsung biasanya dikosongkan untuk puncak organisasi.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Batal</Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            {isEditing ? 'Simpan Perubahan' : 'Tambah Pengguna'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
