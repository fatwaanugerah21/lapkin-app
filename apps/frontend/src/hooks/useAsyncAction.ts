import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

export const useAsyncAction = () => {
  const [isLoading, setIsLoading] = useState(false);

  const run = useCallback(async <T>(action: () => Promise<T>, successMessage?: string): Promise<T | null> => {
    setIsLoading(true);
    try {
      const result = await action();
      if (successMessage) toast.success(successMessage);
      return result;
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Terjadi kesalahan'
        : 'Terjadi kesalahan';
      toast.error(Array.isArray(message) ? message[0] : message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, run };
};
