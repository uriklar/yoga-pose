import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { loadDraftSession, saveDraftSession } from '../src/mobile/sessionStore';

export default function HomeScreen() {
  const [referenceUrl, setReferenceUrl] = useState('');
  const [referenceVideoUri, setReferenceVideoUri] = useState<string | undefined>();

  useEffect(() => {
    loadDraftSession().then((session) => {
      setReferenceUrl(session?.referenceUrl ?? '');
      setReferenceVideoUri(session?.referenceVideoUri);
    });
  }, []);

  async function persistReferenceDraft() {
    await saveDraftSession({
      referenceUrl: referenceUrl.trim() || undefined,
      referenceVideoUri,
    });
  }

  async function importReferenceVideo() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setReferenceVideoUri(uri);
    await saveDraftSession({ referenceVideoUri: uri, referenceUrl: referenceUrl.trim() || undefined });
  }

  async function importUserVideo() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    await saveDraftSession({ userVideoUri: asset.uri, referenceUrl: referenceUrl.trim() || undefined, referenceVideoUri });
    router.push('/analyze');
  }

  async function recordVideo() {
    await persistReferenceDraft();
    router.push('/record');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.title}>Film your yoga. Get clear form tips.</Text>
        <Text style={styles.subtitle}>Local-first pose analysis. Add a reference clip or direct video link when you want comparison mode.</Text>
      </View>

      <Text style={styles.label}>Reference video link (optional)</Text>
      <TextInput
        value={referenceUrl}
        onChangeText={setReferenceUrl}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Direct MP4/MOV/WebM URL"
        placeholderTextColor="#94a3b8"
        style={styles.input}
      />
      <Pressable style={styles.smallButton} onPress={importReferenceVideo}>
        <Text style={styles.smallButtonText}>{referenceVideoUri ? 'Reference clip selected — replace it' : 'Upload reference clip instead'}</Text>
      </Pressable>
      {referenceVideoUri && <Text style={styles.note}>Reference upload saved locally for comparison mode.</Text>}

      <Pressable style={styles.primary} onPress={importUserVideo}>
        <Text style={styles.primaryText}>Import my yoga video</Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={recordVideo}>
        <Text style={styles.secondaryText}>Record new video</Text>
      </Pressable>
      <Pressable style={styles.link} onPress={() => router.push('/settings')}>
        <Text style={styles.linkText}>Privacy/settings</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: '#020617', gap: 14 },
  hero: { marginTop: 24, marginBottom: 12, gap: 10 },
  title: { color: '#f8fafc', fontSize: 32, fontWeight: '800', lineHeight: 38 },
  subtitle: { color: '#cbd5e1', fontSize: 16, lineHeight: 23 },
  label: { color: '#e2e8f0', fontSize: 14, fontWeight: '700' },
  input: { borderColor: '#334155', borderWidth: 1, borderRadius: 12, padding: 14, color: '#f8fafc', backgroundColor: '#0f172a' },
  primary: { backgroundColor: '#38bdf8', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  primaryText: { color: '#082f49', fontWeight: '800', fontSize: 16 },
  secondary: { borderColor: '#38bdf8', borderWidth: 1, borderRadius: 14, padding: 16, alignItems: 'center' },
  secondaryText: { color: '#bae6fd', fontWeight: '700', fontSize: 16 },
  smallButton: { borderColor: '#334155', borderWidth: 1, borderRadius: 12, padding: 12, alignItems: 'center', backgroundColor: '#0f172a' },
  smallButtonText: { color: '#bae6fd', fontWeight: '700' },
  note: { color: '#94a3b8', fontSize: 13 },
  link: { padding: 12, alignItems: 'center' },
  linkText: { color: '#94a3b8', fontWeight: '700' },
});
