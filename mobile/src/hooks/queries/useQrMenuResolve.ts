import { useMutation } from '@tanstack/react-query';
import { resolveQrMenu } from '../../api/qrMenu.api';

export function useQrMenuResolve() {
  return useMutation({
    mutationFn: (qrPayload: string) => resolveQrMenu(qrPayload),
  });
}
