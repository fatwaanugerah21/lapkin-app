import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getSocket } from '../services/socket.service';
import { useLapkinStore } from '../stores/lapkin.store';
import { useAuthStore } from '../stores/auth.store';
import { Lapkin } from '../types';

export const useSocket = () => {
  const { syncLapkin } = useLapkinStore();
  const { user } = useAuthStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const onLapkinLocked = (lapkin: Lapkin) => {
      syncLapkin(lapkin);
      if (user.role === 'manager') {
        toast.success(`LAPKIN dari ${lapkin.employeeName} siap dievaluasi`);
      }
    };

    const onLapkinUnlocked = (lapkin: Lapkin) => {
      syncLapkin(lapkin);
      if (user.role === 'manager') {
        toast(`LAPKIN dari ${lapkin.employeeName} dikembalikan ke draf`, { icon: '🔓' });
      }
    };

    const onLapkinEvaluated = (lapkin: Lapkin) => {
      syncLapkin(lapkin);
      if (user.role === 'pegawai') {
        toast.success('LAPKIN Anda telah dievaluasi oleh manajer');
      }
    };

    const onLapkinEmployeeSigned = (lapkin: Lapkin) => {
      syncLapkin(lapkin);
    };

    socket.on('lapkin:locked', onLapkinLocked);
    socket.on('lapkin:unlocked', onLapkinUnlocked);
    socket.on('lapkin:evaluated', onLapkinEvaluated);
    socket.on('lapkin:employee-signed', onLapkinEmployeeSigned);

    return () => {
      socket.off('lapkin:locked', onLapkinLocked);
      socket.off('lapkin:unlocked', onLapkinUnlocked);
      socket.off('lapkin:evaluated', onLapkinEvaluated);
      socket.off('lapkin:employee-signed', onLapkinEmployeeSigned);
    };
  }, [user, syncLapkin]);
};
