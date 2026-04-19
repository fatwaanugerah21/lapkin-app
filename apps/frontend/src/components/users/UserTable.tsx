import { Pencil, Trash2 } from 'lucide-react';
import { User } from '../../types';
import { RoleBadge } from '../ui/Badge';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export const UserTable = ({ users, onEdit, onDelete }: UserTableProps) => (
  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Nama</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">NIP</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Jabatan</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Peran</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Atasan</th>
            <th className="px-4 py-3 text-center font-semibold text-gray-600 w-24">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-400">{user.username}</p>
              </td>
              <td className="px-4 py-3 text-gray-700 font-mono text-xs">{user.nip}</td>
              <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{user.jobTitle}</td>
              <td className="px-4 py-3">
                <RoleBadge role={user.role} />
              </td>
              <td className="px-4 py-3 text-gray-600 text-xs">{user.managerName ?? '-'}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onEdit(user)}
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                    title="Ubah"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(user)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
