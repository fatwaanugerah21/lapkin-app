import { Printer } from 'lucide-react';
import { Button } from '../ui/Button';

export const LapkinPrintButton = () => (
  <Button
    type="button"
    variant="secondary"
    size="sm"
    className="print:hidden"
    onClick={() => window.print()}
    title="Cetak atau simpan sebagai PDF lewat dialog browser"
  >
    <Printer className="w-4 h-4" />
    Cetak
  </Button>
);
