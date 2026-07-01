import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { colors, spacing } from '../../theme';

interface Props {
  onCapture: (fileUri: string) => void;
}

export function CameraCaptureView({ onCapture }: Props) {
  const camera = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  if (!hasPermission) {
    return (
      <EmptyState
        title="Camera access needed"
        message="Allow camera access to scan a restaurant menu."
        actionLabel="Grant permission"
        onAction={requestPermission}
      />
    );
  }

  if (!device) {
    return <EmptyState title="No camera found" message="This device doesn't have a usable camera." />;
  }

  const handleCapture = async () => {
    if (!camera.current) return;
    const photo = await camera.current.takePhoto({ flash: 'off' });
    onCapture(`file://${photo.path}`);
  };

  return (
    <View style={styles.container}>
      <Camera ref={camera} style={StyleSheet.absoluteFill} device={device} isActive photo />
      <View style={styles.controls}>
        <Button label="Capture Menu" onPress={handleCapture} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.textPrimary },
  controls: { position: 'absolute', bottom: spacing.xxl, left: 0, right: 0, alignItems: 'center' },
});
