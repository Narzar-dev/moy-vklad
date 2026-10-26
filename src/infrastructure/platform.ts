import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const KEY = 'moy-vklad-db-key';
export async function getDatabaseKey() { let key = await SecureStore.getItemAsync(KEY); if (!key) { key = Crypto.randomUUID(); await SecureStore.setItemAsync(KEY, key); } return key; }
export async function authenticateParent() { const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Подтвердите вход взрослого' }); return result.success; }
export async function scheduleReminder(title: string, body: string, hour: number, minute: number) { return Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute } }); }
export function speak(text: string) { Speech.stop(); Speech.speak(text, { language: 'ru-RU' }); }
export async function exportJson(filename: string, value: unknown) { const uri = `${FileSystem.cacheDirectory}${filename}`; await FileSystem.writeAsStringAsync(uri, JSON.stringify(value, null, 2)); if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri); return uri; }
