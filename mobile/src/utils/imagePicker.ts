import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
}

export async function pickFromGallery(): Promise<PickedFile | null> {
  const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
  const asset = result.assets?.[0];
  if (!asset?.uri) return null;

  return { uri: asset.uri, name: asset.fileName ?? 'menu.jpg', mimeType: asset.type ?? 'image/jpeg' };
}

export async function captureWithNativePicker(): Promise<PickedFile | null> {
  const result = await launchCamera({ mediaType: 'photo', quality: 0.8 });
  const asset = result.assets?.[0];
  if (!asset?.uri) return null;

  return { uri: asset.uri, name: asset.fileName ?? 'menu.jpg', mimeType: asset.type ?? 'image/jpeg' };
}
