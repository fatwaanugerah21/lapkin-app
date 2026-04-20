import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

/** Options for {@link useAsyncAction}'s `run`. Failures use `toast.error` from the thrown value only. */
export type RunAsyncOptions = {
  /** Green success toast after `action` resolves; omit for silent success */
  successToast?: string;
};

export const useAsyncAction = () => {
  const [isLoading, setIsLoading] = useState(false);

  const run = useCallback(
    async <T>(action: () => Promise<T>, options?: RunAsyncOptions): Promise<T | null> => {
      setIsLoading(true);
      try {
        const result = await action();
        if (options?.successToast) toast.success(options.successToast);
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
    },
    [],
  );

  return { isLoading, run };
};
