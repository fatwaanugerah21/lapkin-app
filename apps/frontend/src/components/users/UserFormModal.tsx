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
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
];

interface FormState {
  name: string; nip: string; username: string; password: string;
  role: UserRole; jabatan: string; managerId: string;
}

const emptyForm = (): FormState => ({
  name: '', nip: '', username: '', password: '',
  role: 'pegawai', jabatan: '', managerId: '',
});

const userToForm = (user: User): FormState => ({
  name: user.name, nip: user.nip, username: user.username, password: '',
  role: user.role, jabatan: user.jabatan, managerId: user.managerId ?? '',
});

export const UserFormModal = ({ isOpen, onClose, onSubmit, editingUser, isLoading }: UserFormModalProps) => {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [managers, setManagers] = useState<{ id: string; name: string; jabatan: string }[]>([]);

  useEffect(() => {
    setForm(editingUser ? userToForm(editingUser) : emptyForm());
  }, [editingUser, isOpen]);

  useEffect(() => {
    if (isOpen) usersService.getManagers().then(setManagers).catch(() => {});
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
      jabatan: form.jabatan,
      ...(form.managerId && { managerId: form.managerId }),
    };
    await onSubmit(payload);
  };

  const managerOptions = managers.map((m) => ({ value: m.id, label: `${m.name} (${m.jabatan})` }));
  const isEditing = !!editingUser;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Pengguna' : 'Tambah Pengguna'} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Nama Lengkap" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Nama lengkap..." />
          <Input label="NIP" value={form.nip} onChange={(e) => setField('nip', e.target.value)} placeholder="NIP..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Username" value={form.username} onChange={(e) => setField('username', e.target.value)} placeholder="Username..." />
          <Input
            label={isEditing ? 'Password Baru (kosongkan jika tidak diganti)' : 'Password'}
            type="password"
            value={form.password}
            onChange={(e) => setField('password', e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <Input label="Jabatan" value={form.jabatan} onChange={(e) => setField('jabatan', e.target.value)} placeholder="Jabatan..." />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Role"
            value={form.role}
            onChange={(e) => setField('role', e.target.value as UserRole)}
            options={roleOptions}
          />
          {form.role === 'pegawai' && (
            <Select
              label="Manager (Atasan Langsung)"
              value={form.managerId}
              onChange={(e) => setField('managerId', e.target.value)}
              options={managerOptions}
              placeholder="Pilih manager..."
            />
          )}
        </div>

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
