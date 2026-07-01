import * as DocumentPicker from 'expo-document-picker';
import { PickedFile } from './imagePicker';

export async function pickPdfMenu(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  return { uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? 'application/pdf' };
}
