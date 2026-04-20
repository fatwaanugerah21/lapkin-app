import { clsx } from 'clsx';
import { Info } from 'lucide-react';

interface WorkflowHintProps {
  variant?: 'pegawai' | 'supervisor' | 'directorPegawai';
  className?: string;
}

export const WorkflowHint = ({ variant = 'pegawai', className }: WorkflowHintProps) => {
  const body =
    variant === 'pegawai'
      ? 'Isi LAPKIN saat status Draf. Kunci untuk evaluasi agar atasan bisa menilai. Setelah dinilai, tanda tangani sebagai pembuat laporan.'
      : variant === 'directorPegawai'
        ? 'Ini khusus LAPKIN milik pegawai di bawah manajer Anda. Status hanya terkunci atau selesai. Penilaian dan paraf tetap oleh manajer langsung pegawai; Anda memantau isi laporan.'
        : 'Anda hanya melihat LAPKIN yang sudah dikunci atau selesai. Pegawai: dinilai manajer langsung. LAPKIN milik manajer: paraf oleh Anda bila atasan mereka.';

  return (
    <div
      className={clsx(
        'hidden flex gap-2 rounded-lg border border-sky-200 bg-sky-50/90 px-3 py-2 text-xs text-sky-950 leading-snug',
        className,
      )}
      role="note"
    >
      <Info className="w-4 h-4 shrink-0 text-sky-700 mt-0.5" aria-hidden />
      <div>
        <p className="font-semibold text-sky-900">Alur singkat</p>
        <p className="mt-0.5 text-sky-900/90">{body}</p>
      </div>
    </div>
  );
};
