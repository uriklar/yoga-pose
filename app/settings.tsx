import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Privacy defaults</Text>
      <View style={styles.card}>
        <Text style={styles.heading}>Local-first</Text>
        <Text style={styles.text}>The MVP is designed to analyze pose landmarks locally. Raw videos should not be uploaded unless you explicitly opt into cloud processing later.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>Reference links</Text>
        <Text style={styles.text}>A reference-video link should be used only to extract comparison landmarks. We will avoid storing or redistributing copyrighted videos.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>Safety</Text>
        <Text style={styles.text}>Tips are form coaching, not diagnosis. Stop if something hurts and ask a qualified instructor or clinician for persistent pain.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: '#020617', gap: 14 },
  title: { color: '#f8fafc', fontSize: 28, fontWeight: '800', marginTop: 24 },
  card: { backgroundColor: '#0f172a', borderColor: '#1e293b', borderWidth: 1, borderRadius: 16, padding: 16, gap: 6 },
  heading: { color: '#e0f2fe', fontWeight: '800', fontSize: 16 },
  text: { color: '#cbd5e1', fontSize: 15, lineHeight: 22 },
});
