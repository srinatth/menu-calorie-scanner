import React, { useRef } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCameraFormat, useCameraPermission } from 'react-native-vision-camera';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { colors, spacing } from '../../theme';

interface Props {
  onCapture: (fileUri: string) => void;
  onClose: () => void;
}

// Vision-camera reports aspect ratios in landscape orientation (width / height).
// Without a matching format, the library defaults to the sensor's native aspect
// ratio (often 4:3), which the full-screen preview then crops to fill the tall
// screen — so the captured photo silently includes more content (wider top/bottom)
// than what was visible in the on-screen preview. Requesting a format whose photo
// output matches the screen's aspect ratio keeps capture and preview in sync.
const screen = Dimensions.get('screen');
const TARGET_ASPECT_RATIO = screen.height / screen.width;

export function CameraCaptureView({ onCapture, onClose }: Props) {
  const camera = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const format = useCameraFormat(device, [
    { photoAspectRatio: TARGET_ASPECT_RATIO },
    { videoAspectRatio: TARGET_ASPECT_RATIO },
    { photoResolution: 'max' },
  ]);
  const { hasPermission, requestPermission } = useCameraPermission();
  const insets = useSafeAreaInsets();

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
      <Camera ref={camera} style={StyleSheet.absoluteFill} device={device} format={format} isActive photo />
      <Pressable style={[styles.backButton, { top: insets.top + spacing.sm }]} onPress={onClose}>
        <Text style={styles.backButtonLabel}>{'‹'} Back</Text>
      </Pressable>
      <View style={[styles.controls, { bottom: insets.bottom + spacing.xxl }]}>
        <Button label="Capture Menu" onPress={handleCapture} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.textPrimary },
  controls: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  backButton: {
    position: 'absolute',
    left: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backButtonLabel: { color: colors.cardBackground, fontSize: 16, fontWeight: '600' },
});
