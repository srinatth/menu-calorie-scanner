import React, { useEffect } from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { UploadProgressBar } from '../components/scan/UploadProgressBar';
import { EmptyState } from '../components/common/EmptyState';
import { useMenuScanJob } from '../hooks/queries/useMenuScanJob';
import { spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MenuUploadReview'>;

export function MenuUploadReviewScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const { data: job } = useMenuScanJob(jobId);

  useEffect(() => {
    if (job?.status === 'completed') {
      navigation.replace('DetectedDishes', { jobId });
    }
  }, [job?.status, jobId, navigation]);

  return (
    <ScreenContainer>
      <View style={{ flex: 1, justifyContent: 'center', paddingBottom: spacing.xxxl }}>
        {job?.status === 'failed' ? (
          <EmptyState
            title="Menu scan failed"
            message={job.errorMessage ?? 'Something went wrong while analyzing this menu.'}
            actionLabel="Try again"
            onAction={() => navigation.replace('MenuScan')}
          />
        ) : (
          <UploadProgressBar status={job?.status ?? 'pending'} />
        )}
      </View>
    </ScreenContainer>
  );
}
