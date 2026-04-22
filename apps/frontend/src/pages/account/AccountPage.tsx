import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/auth.store';
import { authService } from '../../services/auth.service';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SignaturePad, type SignaturePadHandle } from '../../components/account/SignaturePad';
import { useAsyncAction } from '../../hooks/useAsyncAction';

const roleLabelId: Record<string, string> = {
  admin: 'Administrator',
  manager: 'Manajer',
  pegawai: 'Pegawai',
};

export const AccountPage = () => {
  const user = useAuthStore((s) => s.user);
  const padRef = useRef<SignaturePadHandle>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready'>('loading');
  const [initialSignature, setInitialSignature] = useState<string | null>(null);
  const { isLoading, run } = useAsyncAction();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { signatureDataUrl } = await authService.getMySignature();
        if (!cancelled) setInitialSignature(signatureDataUrl);
      } catch {
        if (!cancelled) toast.error('Gagal memuat tanda tangan');
      } finally {
        if (!cancelled) setLoadState('ready');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loadState !== 'ready') return;
    if (initialSignature) {
      padRef.current?.loadFromDataUrl(initialSignature);
    }
  }, [loadState, initialSignature]);

  const handleSave = () => {
    run(async () => {
      const dataUrl = padRef.current?.toDataURL() ?? null;
      await authService.updateMySignature({ signatureDataUrl: dataUrl });
    }, { successToast: 'Tanda tangan berhasil disimpan' });
  };

  const handleClearPad = () => {
    padRef.current?.clear();
  };

  const handleRemoveFromServer = () => {
    run(async () => {
      padRef.current?.clear();
      await authService.updateMySignature({ signatureDataUrl: null });
    }, { successToast: 'Tanda tangan dihapus' });
  };

  if (!user) return null;

  const roleLabel = roleLabelId[user.role] ?? user.role;

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <Card>
        <CardHeader
          title="Akun saya"
          subtitle="Profil dan tanda tangan untuk footer LAPKIN"
        />
        <dl className="grid grid-cols-1 gap-3 text-sm border-t border-gray-100 pt-4">
          <div>
            <dt className="text-gray-500">Nama</dt>
            <dd className="font-medium text-gray-900">{user.name}</dd>
          </div>
          <div>
            <dt className="text-gray-500">NIP</dt>
            <dd className="font-medium text-gray-900">{user.nip}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Peran</dt>
            <dd className="font-medium text-gray-900">{roleLabel}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Jabatan</dt>
            <dd className="font-medium text-gray-900">{user.jobTitle}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <CardHeader
          title="Tanda tangan"
          subtitle="Gambar di kotak di bawah. Tanda tangan ditampilkan pada LAPKIN di bawah nama Anda sebagai pembuat laporan atau penilai."
        />
        {loadState === 'loading' ? (
          <p className="text-sm text-gray-500">Memuat…</p>
        ) : (
          <>
            <SignaturePad ref={padRef} className="mb-4" />
            <p className="text-xs text-gray-500 mb-4">
              Gunakan mouse atau layar sentuh. Tombol Bersihkan menghapus gambar. Simpan untuk menyimpan tanda
              tangan pada laporan.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={handleClearPad} disabled={isLoading}>
                Bersihkan
              </Button>
              <Button type="button" size="sm" onClick={handleSave} isLoading={isLoading}>
                Simpan tanda tangan
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveFromServer}
                isLoading={isLoading}
              >
                Hapus tanda tangan tersimpan
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
