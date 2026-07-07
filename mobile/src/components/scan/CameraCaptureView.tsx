import React, { useRef } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCameraFormat, useCameraPermission } from 'react-native-vision-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { colors, spacing } from '../../theme';

interface Props {
  onCapture: (fileUri: string) => void;
  onClose: () => void;
}

// The full-screen preview renders in "cover" mode: it takes the camera frame and
// centre-crops it to fill the tall screen, so you only see a centred slice.
// takePhoto() saves the *whole* frame, which includes rows above/below that
// slice — that's why scans picked up dishes just off the top/bottom of the
// preview. No sensor format matches a phone's ~20:9 screen, so aspect-ratio
// matching alone can't fix it; instead we crop the captured photo back down to
// the on-screen slice (see cropToPreview below). We still request the max-res
// photo format so OCR gets the sharpest possible crop.
const screen = Dimensions.get('screen');
const SCREEN_ASPECT_RATIO = screen.width / screen.height; // portrait, < 1

export function CameraCaptureView({ onCapture, onClose }: Props) {
  const camera = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const format = useCameraFormat(device, [{ photoResolution: 'max' }]);
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
    const uri = `file://${photo.path}`;
    onCapture(await cropToPreview(uri));
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

/**
 * Crops a captured photo down to the region the "cover" preview actually showed:
 * a centred slice at the screen's aspect ratio. Loads the image once (the ref
 * carries the manipulator's own upright width/height, so no orientation guessing)
 * and centre-crops in that same coordinate frame. Falls back to the original
 * photo if anything goes wrong — a slightly-too-wide scan beats a failed capture.
 */
async function cropToPreview(uri: string): Promise<string> {
  try {
    const ref = await ImageManipulator.manipulate(uri).renderAsync();
    const { width, height } = ref;
    const imageAspectRatio = width / height;

    let cropWidth: number;
    let cropHeight: number;
    if (imageAspectRatio > SCREEN_ASPECT_RATIO) {
      // Photo is wider than the screen slice → preview cropped the left/right.
      cropHeight = height;
      cropWidth = Math.round(height * SCREEN_ASPECT_RATIO);
    } else {
      // Photo is taller/narrower than the screen slice → preview cropped top/bottom.
      cropWidth = width;
      cropHeight = Math.round(width / SCREEN_ASPECT_RATIO);
    }
    const originX = Math.round((width - cropWidth) / 2);
    const originY = Math.round((height - cropHeight) / 2);

    const cropped = await ImageManipulator.manipulate(ref)
      .crop({ originX, originY, width: cropWidth, height: cropHeight })
      .renderAsync();
    const result = await cropped.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
    return result.uri;
  } catch {
    return uri;
  }
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
