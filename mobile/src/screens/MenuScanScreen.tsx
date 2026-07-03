import React from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { CameraCaptureView } from '../components/scan/CameraCaptureView';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useUploadMenuScan } from '../hooks/queries/useUploadMenuScan';

type Props = NativeStackScreenProps<RootStackParamList, 'MenuScan'>;

export function MenuScanScreen({ navigation }: Props) {
  const uploadMutation = useUploadMenuScan();

  const handleCapture = async (fileUri: string) => {
    const { jobId } = await uploadMutation.mutateAsync({
      sourceType: 'camera',
      fileUri,
      fileName: 'menu-capture.jpg',
      mimeType: 'image/jpeg',
    });
    navigation.replace('MenuUploadReview', { jobId });
  };

  if (uploadMutation.isPending) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <LoadingSpinner label="Uploading photo…" />
      </View>
    );
  }

  return <CameraCaptureView onCapture={handleCapture} onClose={() => navigation.goBack()} />;
}
