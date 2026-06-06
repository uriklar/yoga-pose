import { StyleSheet, Text, View } from 'react-native';

type Point = { x: number; y: number; score?: number };
type LandmarkMap = Record<string, Point | undefined>;
type VisualComparison = {
  normalizedUser?: LandmarkMap;
  normalizedTarget?: LandmarkMap;
  highlightedAreas?: string[];
  landmarkDistances?: Record<string, number>;
  legend?: { user?: string; target?: string };
};

const BONES = [
  ['nose', 'leftEye', 'head'], ['nose', 'rightEye', 'head'],
  ['leftEye', 'leftEar', 'head'], ['rightEye', 'rightEar', 'head'],
  ['nose', 'leftShoulder', 'head'], ['nose', 'rightShoulder', 'head'],
  ['leftShoulder', 'rightShoulder', 'shoulders'],
  ['leftShoulder', 'leftElbow', 'arms'], ['leftElbow', 'leftWrist', 'arms'],
  ['rightShoulder', 'rightElbow', 'arms'], ['rightElbow', 'rightWrist', 'arms'],
  ['leftShoulder', 'leftHip', 'hips'], ['rightShoulder', 'rightHip', 'hips'],
  ['leftHip', 'rightHip', 'hips'],
  ['leftHip', 'leftKnee', 'knees'], ['leftKnee', 'leftAnkle', 'feet'],
  ['rightHip', 'rightKnee', 'knees'], ['rightKnee', 'rightAnkle', 'feet'],
  ['leftAnkle', 'leftHeel', 'feet'], ['leftAnkle', 'leftFootIndex', 'feet'],
  ['rightAnkle', 'rightHeel', 'feet'], ['rightAnkle', 'rightFootIndex', 'feet'],
] as const;

const AREA_JOINTS: Record<string, string[]> = {
  head: ['nose', 'leftEye', 'rightEye', 'leftEar', 'rightEar'],
  shoulders: ['leftShoulder', 'rightShoulder'],
  arms: ['leftElbow', 'rightElbow', 'leftWrist', 'rightWrist'],
  hips: ['leftHip', 'rightHip'],
  knees: ['leftKnee', 'rightKnee'],
  feet: ['leftAnkle', 'rightAnkle', 'leftHeel', 'rightHeel', 'leftFootIndex', 'rightFootIndex'],
};

const WIDTH = 320;
const HEIGHT = 300;

export function PoseOverlay({ visual }: { visual?: VisualComparison }) {
  if (!visual?.normalizedUser || !visual?.normalizedTarget) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>No pose overlay available yet. Try a clip with your full body visible.</Text>
      </View>
    );
  }

  const highlighted = new Set(visual.highlightedAreas ?? []);
  const user = projectSkeleton(visual.normalizedUser);
  const target = projectSkeleton(visual.normalizedTarget);
  const worst = worstJointLabels(visual.landmarkDistances ?? {});

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Where your pose differs</Text>
      <Text style={styles.subtitle}>Blue = target/reference. Pink = you. Yellow marks body areas to fix first. Head and feet are drawn when landmarks are available.</Text>
      <View style={styles.canvas}>
        <SkeletonLines points={target} color="rgba(56,189,248,0.62)" width={3} highlighted={new Set()} />
        <SkeletonLines points={user} color="rgba(251,113,133,0.9)" width={4} highlighted={highlighted} />
        <SkeletonJoints points={target} color="#38bdf8" size={5} highlighted={new Set()} />
        <SkeletonJoints points={user} color="#fb7185" size={7} highlighted={highlighted} />
      </View>
      <View style={styles.legendRow}>
        <View style={[styles.dot, { backgroundColor: '#38bdf8' }]} /><Text style={styles.legend}>{visual.legend?.target ?? 'Target'}</Text>
        <View style={[styles.dot, { backgroundColor: '#fb7185', marginLeft: 14 }]} /><Text style={styles.legend}>{visual.legend?.user ?? 'You'}</Text>
      </View>
      {Boolean(worst.length) && <Text style={styles.worst}>Largest landmark differences: {worst.join(', ')}</Text>}
    </View>
  );
}

function SkeletonLines({ points, color, width, highlighted }: { points: Record<string, { x: number; y: number }>; color: string; width: number; highlighted: Set<string> }) {
  return <>{BONES.map(([a, b, area]) => {
    const p1 = points[a]; const p2 = points[b];
    if (!p1 || !p2) return null;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const hot = highlighted.has(area);
    const thickness = hot ? width + 5 : width;
    return <View key={`${a}-${b}`} style={{ position: 'absolute', left: p1.x + dx / 2 - length / 2, top: p1.y + dy / 2 - thickness / 2, width: length, height: thickness, backgroundColor: hot ? '#facc15' : color, borderRadius: 99, transform: [{ rotate: `${angle}deg` }], opacity: hot ? 0.95 : 0.8 }} />;
  })}</>;
}

function SkeletonJoints({ points, color, size, highlighted }: { points: Record<string, { x: number; y: number }>; color: string; size: number; highlighted: Set<string> }) {
  return <>{Object.entries(points).map(([name, p]) => {
    const hot = [...highlighted].some((area) => AREA_JOINTS[area]?.includes(name));
    const s = hot ? size + 8 : size;
    return <View key={name} style={{ position: 'absolute', left: p.x - s / 2, top: p.y - s / 2, width: s, height: s, borderRadius: s, backgroundColor: hot ? '#facc15' : color, borderWidth: hot ? 2 : 0, borderColor: '#fef3c7' }} />;
  })}</>;
}

function projectSkeleton(points: LandmarkMap) {
  const entries = Object.entries(points).filter(([, p]) => p && Number.isFinite(p.x) && Number.isFinite(p.y)) as [string, Point][];
  if (!entries.length) return {};
  const xs = entries.map(([, p]) => p.x);
  const ys = entries.map(([, p]) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = Math.max(0.01, maxX - minX);
  const spanY = Math.max(0.01, maxY - minY);
  const scale = Math.min((WIDTH - 48) / spanX, (HEIGHT - 48) / spanY);
  const offsetX = (WIDTH - spanX * scale) / 2;
  const offsetY = (HEIGHT - spanY * scale) / 2;
  return Object.fromEntries(entries.map(([name, p]) => [name, { x: offsetX + (p.x - minX) * scale, y: offsetY + (p.y - minY) * scale }]));
}

function worstJointLabels(distances: Record<string, number>) {
  return Object.entries(distances)
    .filter(([, v]) => Number.isFinite(v))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name]) => name.replace(/([A-Z])/g, ' $1').toLowerCase());
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0f172a', borderColor: '#1e293b', borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  title: { color: '#f8fafc', fontSize: 20, fontWeight: '900' },
  subtitle: { color: '#cbd5e1', fontSize: 13, lineHeight: 18 },
  canvas: { width: WIDTH, height: HEIGHT, alignSelf: 'center', backgroundColor: '#020617', borderColor: '#334155', borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  legendRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 10, marginRight: 6 },
  legend: { color: '#cbd5e1', fontSize: 13, fontWeight: '700' },
  worst: { color: '#fde68a', fontSize: 13, lineHeight: 18 },
  emptyCard: { backgroundColor: '#0f172a', borderColor: '#1e293b', borderWidth: 1, borderRadius: 18, padding: 14 },
  emptyText: { color: '#cbd5e1', fontSize: 14, lineHeight: 20 },
});
