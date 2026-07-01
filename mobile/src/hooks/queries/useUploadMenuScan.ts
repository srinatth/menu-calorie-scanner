import { useMutation } from '@tanstack/react-query';
import { uploadMenuScan, UploadMenuScanInput } from '../../api/menuScan.api';

export function useUploadMenuScan() {
  return useMutation({
    mutationFn: (input: UploadMenuScanInput) => uploadMenuScan(input),
  });
}
