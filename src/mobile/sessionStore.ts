import { documentDirectory, getInfoAsync, readAsStringAsync, writeAsStringAsync } from 'expo-file-system/legacy';

type AppState = {
  draftSession?: any;
  lastResult?: any;
};

const fallbackState: AppState = {};
const stateFile = `${documentDirectory ?? ''}yoga-pose-coach-state.json`;

export async function saveDraftSession(session: any) {
  const state = await readState();
  state.draftSession = { ...state.draftSession, ...session, updatedAt: new Date().toISOString() };
  await writeState(state);
}

export async function loadDraftSession() {
  return (await readState()).draftSession ?? null;
}

export async function saveLastResult(result: any) {
  const state = await readState();
  state.lastResult = { ...result, updatedAt: new Date().toISOString() };
  await writeState(state);
}

export async function loadLastResult() {
  return (await readState()).lastResult ?? null;
}

export async function clearSessionState() {
  await writeState({});
}

async function readState(): Promise<AppState> {
  if (!documentDirectory) return fallbackState;
  try {
    const info = await getInfoAsync(stateFile);
    if (!info.exists) return {};
    const raw = await readAsStringAsync(stateFile);
    return JSON.parse(raw) as AppState;
  } catch {
    return {};
  }
}

async function writeState(state: AppState) {
  Object.assign(fallbackState, state);
  if (!documentDirectory) return;
  await writeAsStringAsync(stateFile, JSON.stringify(state, null, 2));
}
