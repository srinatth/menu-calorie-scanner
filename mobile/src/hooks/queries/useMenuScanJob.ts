import { useQuery } from '@tanstack/react-query';
import { MenuScanJob } from '@menu-scanner/shared';
import { getMenuScanJob } from '../../api/menuScan.api';

const POLL_INTERVAL_MS = 1800;
const TERMINAL_STATUSES: MenuScanJob['status'][] = ['completed', 'failed'];

export function useMenuScanJob(jobId: string | null) {
  return useQuery({
    queryKey: ['menu-scan-job', jobId],
    queryFn: () => getMenuScanJob(jobId as string),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && TERMINAL_STATUSES.includes(status)) return false;
      return POLL_INTERVAL_MS;
    },
  });
}
