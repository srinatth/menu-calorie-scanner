import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useQrMenuResolve } from '../hooks/queries/useQrMenuResolve';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'QRScan'>;

export function QRScanScreen({ navigation }: Props) {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const resolveMutation = useQrMenuResolve();
  const [handled, setHandled] = useState(false);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      const value = codes[0]?.value;
      if (!value || handled) return;
      setHandled(true);
      resolveMutation.mutate(value, {
        onSuccess: ({ jobId }) => navigation.replace('MenuUploadReview', { jobId }),
        onError: () => setHandled(false),
      });
    },
  });

  if (!hasPermission) {
    return (
      <EmptyState
        title="Camera access needed"
        message="Allow camera access to scan a restaurant QR menu."
        actionLabel="Grant permission"
        onAction={requestPermission}
      />
    );
  }

  if (!device) {
    return <EmptyState title="No camera found" message="This device doesn't have a usable camera." />;
  }

  return (
    <View style={styles.container}>
      <Camera style={StyleSheet.absoluteFill} device={device} isActive codeScanner={codeScanner} />
      {resolveMutation.isPending ? (
        <View style={styles.overlay}>
          <LoadingSpinner label="Reading QR menu…" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.textPrimary },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
});
