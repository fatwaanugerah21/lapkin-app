import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { usersService } from '../../services/users.service';
import { User, CreateUserPayload, UpdateUserPayload } from '../../types';
import { UserTable } from '../../components/users/UserTable';
import { UserFormModal } from '../../components/users/UserFormModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { useAsyncAction } from '../../hooks/useAsyncAction';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { isLoading: isMutating, run } = useAsyncAction();

  const loadUsers = async () => {
    setIsLoading(true);
    const data = await usersService.getAll();
    setUsers(data);
    setIsLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async (payload: CreateUserPayload) => {
    await run(async () => {
      await usersService.create(payload);
      await loadUsers();
      setShowCreateModal(false);
    }, { successToast: 'Pengguna berhasil ditambahkan' });
  };

  const handleUpdate = async (payload: CreateUserPayload) => {
    if (!editingUser) return;
    const updatePayload: UpdateUserPayload = {
      ...payload,
      password: payload.password || undefined,
    };
    await run(async () => {
      await usersService.update(editingUser.id, updatePayload);
      await loadUsers();
      setEditingUser(null);
    }, { successToast: 'Pengguna berhasil diperbarui' });
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    await run(async () => {
      await usersService.remove(deletingUser.id);
      await loadUsers();
      setDeletingUser(null);
    }, { successToast: 'Pengguna berhasil dihapus' });
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Kelola Pengguna"
        subtitle="Tambah, ubah, dan hapus akun pengguna sistem"
        action={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            Tambah Pengguna
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : users.length === 0 ? (
        <EmptyState
          title="Belum ada pengguna"
          description="Tambahkan pengguna pertama untuk memulai."
          action={<Button onClick={() => setShowCreateModal(true)}>Tambah Pengguna</Button>}
        />
      ) : (
        <UserTable
          users={users}
          onEdit={setEditingUser}
          onDelete={setDeletingUser}
        />
      )}

      <UserFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        isLoading={isMutating}
      />

      <UserFormModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSubmit={handleUpdate}
        editingUser={editingUser}
        isLoading={isMutating}
      />

      <ConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDelete}
        title="Hapus Pengguna"
        message={`Apakah Anda yakin ingin menghapus ${deletingUser?.name}? Semua LAPKIN milik pengguna ini juga akan dihapus.`}
        confirmLabel="Hapus Pengguna"
        isLoading={isMutating}
      />
    </div>
  );
};
