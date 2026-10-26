import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { Easing, FadeIn, FadeInDown, FadeOut, cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Defs, Ellipse, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';
import { Collapsible } from '@/src/ui/Collapsible';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { defaultState as importedProfileDefaults } from '@/src/infrastructure/storage';
import { catalog, taskCategories } from '@/src/content/catalog';
import { completedMessage } from '@/src/content/messages';
import { detectLanguage, genderTr, languageNames, taskCount, tr, translatedCategory, translatedDifficulty, translatedStarDesign, translatedTask, translatedTheme, type Language } from '@/src/content/i18n';
import { normalizeTaskXp, taskFromTemplate, xpToNextStar } from '@/src/domain/task-library';
import { calculateXp } from '@/src/domain/xp';
import { difficultyOptions, normalizeDifficulty, type Difficulty } from '@/src/domain/difficulty';
import { normalizeStarDesign, secondStarDesigns, thirdStarDesigns } from '@/src/domain/star-designs';
import { isPastTimeWindow, isWithinTimeWindow, localDayKey, selectAvailable } from '@/src/domain/selection';
import type { AssistanceLevel, Gender, Occurrence, TaskTemplate } from '@/src/domain/types';
import { applyRecommendedTaskTimes, defaultState, deleteFamily, loadFamily, saveFamily, type ChildTheme, type FamilyState, type StoredCategory, type StoredTask, type TaskHistoryEntry } from '@/src/infrastructure/storage';
import { styles } from '@/src/ui/styles';
import { StarIcon } from '@/src/ui/StarIcon';
import { DisclosureChevron } from '@/src/ui/DisclosureChevron';
import { ChildDashboard } from '@/src/ui/ChildDashboard';
import { AppTextInput as TextInput } from '@/src/ui/AppTextInput';

const LanguageContext = createContext<Language>('ru');
const useUiLanguage = () => useContext(LanguageContext);

const themeList: { id: Exclude<ChildTheme, 'custom'>; label: string; emoji: string; background: string; surface: string; primary: string; soft: string; text: string; muted: string }[] = [
  { id: 'sunny', label: 'Солнечная', emoji: '☀️', background: '#FFF7E6', surface: '#FFFFFF', primary: '#F28A38', soft: '#FFE3A5', text: '#3B2A1D', muted: '#735E4D' },
  { id: 'ocean', label: 'Морская', emoji: '🐳', background: '#EDF8FF', surface: '#FFFFFF', primary: '#2786C8', soft: '#BFE8FF', text: '#19354A', muted: '#537187' },
  { id: 'forest', label: 'Лесная', emoji: '🦊', background: '#EFF8EF', surface: '#FFFFFF', primary: '#478C5B', soft: '#CBECCD', text: '#25452E', muted: '#58715D' },
  { id: 'berry', label: 'Ягодная', emoji: '🍓', background: '#FFF0F4', surface: '#FFFFFF', primary: '#D94E76', soft: '#FFD1DF', text: '#4D2432', muted: '#805665' },
  { id: 'lavender', label: 'Лавандовая', emoji: '🦄', background: '#F5F0FF', surface: '#FFFFFF', primary: '#8064C7', soft: '#E0D4FF', text: '#332650', muted: '#665B80' },
  { id: 'mint', label: 'Мятная', emoji: '🍃', background: '#EEFBF6', surface: '#FFFFFF', primary: '#36A889', soft: '#C9F0E1', text: '#20453A', muted: '#54766B' },
  { id: 'coral', label: 'Коралловая', emoji: '🐠', background: '#FFF3EE', surface: '#FFFFFF', primary: '#E9795A', soft: '#FFD8C9', text: '#4B2B23', muted: '#806056' },
  { id: 'space', label: 'Космос', emoji: '🚀', background: '#F0F1FF', surface: '#FFFFFF', primary: '#595FC7', soft: '#D8DBFF', text: '#292B53', muted: '#5C5F88' },
  { id: 'rainbow', label: 'Радужная', emoji: '🌈', background: '#FFF3F8', surface: '#FFFFFF', primary: '#B658B5', soft: '#F7D7EF', text: '#432A46', muted: '#765E79' },
  { id: 'lemon', label: 'Лимонная', emoji: '🍋', background: '#FBFBEA', surface: '#FFFFFF', primary: '#A1A82E', soft: '#EEF0AD', text: '#40421F', muted: '#70714C' },
  { id: 'rose', label: 'Розовая', emoji: '🌸', background: '#FFF1F1', surface: '#FFFFFF', primary: '#D96B83', soft: '#FFD7DF', text: '#4C2931', muted: '#805B63' },
  { id: 'sky', label: 'Небесная', emoji: '☁️', background: '#EFF9FF', surface: '#FFFFFF', primary: '#4E9ED4', soft: '#D0ECFF', text: '#263C4A', muted: '#5E7685' },
  { id: 'meadow', label: 'Луг', emoji: '🌼', background: '#F4F8E9', surface: '#FFFFFF', primary: '#78A849', soft: '#E0EDBF', text: '#334126', muted: '#62734F' },
  { id: 'candy', label: 'Конфетная', emoji: '🍬', background: '#F0FAFC', surface: '#FFFFFF', primary: '#42A7AE', soft: '#C9F0F0', text: '#244347', muted: '#58777A' },
  { id: 'peach', label: 'Персиковая', emoji: '🍑', background: '#FFF5ED', surface: '#FFFFFF', primary: '#D98753', soft: '#FFE1C6', text: '#4A3325', muted: '#806A5D' },
];
const themes: Record<Exclude<ChildTheme, 'custom'>, { label: string; emoji: string; background: string; surface: string; primary: string; soft: string; text: string; muted: string }> = Object.fromEntries(themeList.map(({ id, ...theme }) => [id, theme])) as Record<Exclude<ChildTheme, 'custom'>, { label: string; emoji: string; background: string; surface: string; primary: string; soft: string; text: string; muted: string }>;
function contrastRatio(a: string, b: string) {
  const luminance = (hex: string) => {
    const rgb = hex.replace('#', '').match(/.{2}/g)?.map((part) => Number.parseInt(part, 16) / 255) ?? [0, 0, 0];
    const linear = rgb.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
function readableText(background: string, muted = false) {
  const black = '#292522'; const white = '#FFFFFF';
  const dark = contrastRatio(black, background) >= contrastRatio(white, background) ? black : white;
  if (!muted) return dark;
  const candidate = dark === white ? '#E4DDD7' : '#625951';
  return contrastRatio(candidate, background) >= 4.5 ? candidate : dark;
}
const screenUi = StyleSheet.create({
  gateOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15,23,42,0.56)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  gateCard: { backgroundColor: '#FFFFFF', width: '100%', maxWidth: 390, borderRadius: 22, padding: 24, gap: 12 },
  gateTitle: { fontSize: 21, fontWeight: '900', color: '#1E2923', textAlign: 'center' },
  gateHint: { fontSize: 12, color: '#64748B', textAlign: 'center', marginBottom: 4 },
  gateInput: { backgroundColor: '#F4F7F6', borderWidth: 1, borderColor: '#DEE8E1', borderRadius: 12, padding: 12, textAlign: 'center', fontSize: 24, letterSpacing: 10, color: '#1E2923' },
  gateButton: { backgroundColor: '#2B8A6E', padding: 13, borderRadius: 12, alignItems: 'center' },
  gateButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  gateCancel: { padding: 8, alignItems: 'center' },
  gateCancelText: { color: '#64748B', fontWeight: '700' },
});
const modalUi = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(20,35,27,0.48)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  sheet: { width: '100%', maxWidth: 440, maxHeight: '92%', backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#E3EAE6', overflow: 'hidden' },
  form: { padding: 16, gap: 10 }, titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { color: '#1E2923', fontSize: 18, fontWeight: '900' }, close: { color: '#64748B', fontSize: 28, lineHeight: 30, paddingHorizontal: 4 },
  titleInput: { backgroundColor: '#FFFFFF', borderColor: '#E9A000', borderWidth: 2, borderRadius: 14, paddingHorizontal: 13, minHeight: 52, fontSize: 15 }, newCategoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, newCategoryInput: { flex: 1, color: '#2B8A6E', fontSize: 12, fontWeight: '700', padding: 6, paddingHorizontal: 9, minHeight: 38, borderWidth: 1, borderColor: '#E2EAE5', borderRadius: 10, backgroundColor: '#FFFFFF' }, newCategoryButton: { color: '#2B8A6E', fontSize: 12, fontWeight: '800' }, categoryIconPicker: { gap: 4 },
  label: { color: '#64748B', fontSize: 12, fontWeight: '700', marginTop: 2 }, timeRow: { flexDirection: 'row', gap: 9 }, timeInput: { flex: 1, minHeight: 46, borderRadius: 12, paddingHorizontal: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2EAE5', fontSize: 14 }, xpInput: { minHeight: 42, borderRadius: 12, paddingHorizontal: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2EAE5', fontSize: 13 }, submit: { backgroundColor: '#2B8A6E', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 2 }, submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' }, note: { color: '#64748B', fontSize: 11, textAlign: 'center' },
});
const parentUi = StyleSheet.create({
  shell: { flex: 1, gap: 14 }, wideShell: { flexDirection: 'row', gap: 0, backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', minHeight: 650 },
  sidebar: { width: 230, backgroundColor: '#F7FAF8', borderRightWidth: 1, borderRightColor: '#E2EAE5', padding: 20 },
  brand: { color: '#1E2923', fontSize: 19, fontWeight: '900' }, brandSub: { color: '#8A9A90', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 5, marginBottom: 25 },
  sideNav: { gap: 5 }, mobileNav: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, sideTab: { padding: 12, borderRadius: 10 }, mobileTab: { paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6ECE8' }, activeTab: { backgroundColor: '#DFF1E7', borderColor: '#B4DCC5' }, navText: { color: '#5B6E62', fontWeight: '800', fontSize: 12 }, activeNavText: { color: '#217451' }, sideBack: { borderRadius: 10, backgroundColor: '#2B8A6E', padding: 12 }, sideBackText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  main: { flex: 1, padding: 20, gap: 15 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, eyebrow: { color: '#85958A', fontSize: 10, fontWeight: '800', letterSpacing: 1 }, title: { color: '#1E2923', fontSize: 23, fontWeight: '900', marginTop: 3 }, headerXp: { backgroundColor: '#FFF3DB', borderRadius: 10, padding: 10 }, headerXpText: { color: '#8B611E', fontWeight: '900', fontSize: 12 }, back: { color: '#2B8A6E', fontWeight: '800', paddingVertical: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, statCard: { minWidth: 190, flexGrow: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6ECE8', borderRadius: 16, padding: 16, gap: 5 }, statLabel: { color: '#8A9A90', fontSize: 10, fontWeight: '900', letterSpacing: 1 }, statValue: { color: '#1E2923', fontSize: 26, fontWeight: '900' }, statNote: { color: '#64748B', fontSize: 11 }, statTrack: { height: 8, borderRadius: 6, backgroundColor: '#EAF2EC', overflow: 'hidden', marginTop: 9 }, statFill: { height: 8, backgroundColor: '#2B8A6E' }, tip: { width: '100%', backgroundColor: '#EAF7EE', borderRadius: 16, padding: 16, gap: 5 }, tipTitle: { color: '#245E3E', fontWeight: '900', fontSize: 13 }, tipText: { color: '#467359', fontSize: 12, lineHeight: 19 }, quickLink: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6ECE8', borderRadius: 12, padding: 13 }, quickLinkText: { color: '#2B8A6E', fontWeight: '800', fontSize: 12 },
  stack: { gap: 14 }, surface: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5ECE7', borderRadius: 16, padding: 16, gap: 11 }, heading: { color: '#1E2923', fontSize: 16, fontWeight: '900' }, helper: { color: '#64748B', fontSize: 12, lineHeight: 18 }, primaryButton: { backgroundColor: '#2B8A6E', borderRadius: 12, padding: 12, alignItems: 'center' }, primaryButtonText: { color: '#FFFFFF', fontWeight: '900' }, historyHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, historyXp: { color: '#2B8A6E', fontWeight: '900', fontSize: 12 }, historyRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#EFF2F0', paddingTop: 10, gap: 10 }, historyItem: { color: '#32443A', flex: 1, fontSize: 12 }, secondaryButton: { backgroundColor: '#F1F6F3', borderRadius: 10, padding: 12 }, secondaryButtonText: { color: '#2A684A', fontWeight: '800', textAlign: 'center' }, deleteButton: { backgroundColor: '#FFF0EF', borderRadius: 10, padding: 12 }, deleteText: { color: '#B5443B', fontWeight: '800', textAlign: 'center' },
});
const settingsUi = StyleSheet.create({
  layout: { gap: 16 }, wideLayout: { flexDirection: 'row', alignItems: 'flex-start' }, main: { flex: 1, gap: 12 }, previewColumn: { width: '100%', maxWidth: 350, gap: 10, alignSelf: 'center' }, heading: { color: '#1E2923', fontSize: 16, fontWeight: '900', marginTop: 8 }, helper: { color: '#64748B', fontSize: 12, lineHeight: 18 }, info: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16 },
});
const taskUi = StyleSheet.create({
  backButton: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 14, borderWidth: 1 }, backChevron: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }, backChevronStroke: { position: 'absolute', left: 5, width: 7, height: 1.8, borderRadius: 1 }, backChevronUpper: { top: 6, transform: [{ rotate: '-45deg' }] }, backChevronLower: { top: 11, transform: [{ rotate: '45deg' }] }, backText: { fontSize: 14, fontWeight: '800' },
  hero: { flexDirection: 'row', gap: 16, backgroundColor: '#FFFFFF', padding: 18, borderRadius: 18, borderWidth: 1, borderColor: '#E5ECE7', alignItems: 'center' }, heroIcon: { width: 70, height: 70, borderRadius: 17, backgroundColor: '#EAF7EE', alignItems: 'center', justifyContent: 'center' }, heroEmoji: { fontSize: 37 }, heroText: { flex: 1 }, eyebrow: { fontSize: 10, fontWeight: '900', color: '#2B8A6E', letterSpacing: 0.7 }, title: { color: '#1E2923', fontSize: 23, fontWeight: '900', marginTop: 3 }, hint: { color: '#64748B', fontSize: 12, marginTop: 4 }, columns: { gap: 17 }, wideColumns: { flexDirection: 'row' }, column: { flex: 1, gap: 10 }, sectionTitle: { fontSize: 17, fontWeight: '900', color: '#1E2923', marginTop: 5 }, sub: { color: '#64748B', fontSize: 12 }, card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5ECE7', padding: 16, borderRadius: 17, gap: 12 }, step: { flexDirection: 'row', alignItems: 'center', gap: 12 }, stepNumber: { width: 28, height: 28, borderRadius: 14, textAlign: 'center', lineHeight: 28, color: '#2B8A6E', backgroundColor: '#E3F3E9', fontWeight: '900' }, stepText: { flex: 1, color: '#2E4135', fontSize: 14 }, note: { backgroundColor: '#EDF7F0', borderRadius: 13, padding: 12 }, noteText: { color: '#4A7057', fontSize: 12 },
});
const onboardUi = StyleSheet.create({
  page: { padding: 18, width: '100%', maxWidth: 600, alignSelf: 'center' }, widePage: { maxWidth: 1020, padding: 35 }, layout: { gap: 18 }, wideLayout: { flexDirection: 'row', alignItems: 'stretch', gap: 26 }, intro: { flex: 1, backgroundColor: '#E6F4EB', borderRadius: 22, padding: 24, gap: 11 }, brand: { color: '#217451', fontSize: 17, fontWeight: '900' }, introIcon: { fontSize: 38, marginTop: 20 }, introTitle: { color: '#1E2923', fontSize: 27, fontWeight: '900' }, introText: { color: '#4F6A59', fontSize: 14, lineHeight: 21 }, introTip: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 13, marginTop: 12 }, introTipText: { color: '#4F6A59', fontSize: 12 }, form: { flex: 1.2, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5ECE7', borderRadius: 22, padding: 21, gap: 10 }, formTitle: { fontSize: 19, fontWeight: '900', color: '#1E2923', marginBottom: 3 }, label: { color: '#425649', fontSize: 12, fontWeight: '800', marginTop: 4 }, input: { backgroundColor: '#F7F9F8', borderWidth: 1, borderColor: '#DFE7E1', padding: 12, borderRadius: 11, color: '#1E2923', fontSize: 14 }, options: { flexDirection: 'row', gap: 7 }, option: { flex: 1, borderWidth: 1, borderColor: '#DFE7E1', borderRadius: 10, padding: 9, backgroundColor: '#F7F9F8', alignItems: 'center' }, selected: { borderColor: '#2B8A6E', backgroundColor: '#E7F5EC' }, optionText: { color: '#365244', fontSize: 11, fontWeight: '800' }, submit: { backgroundColor: '#2B8A6E', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 6 }, submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
});
function paletteWithContrast<T extends { background: string; surface: string; soft: string }>(palette: T) {
  return { ...palette, text: readableText(palette.surface), muted: readableText(palette.surface, true), backgroundText: readableText(palette.background), backgroundMuted: readableText(palette.background, true), softText: readableText(palette.soft), softMuted: readableText(palette.soft, true) };
}
const starterTasks = () => catalog.filter((task) => ['home-clothes', 'home-plant', 'home-toys', 'home-bed', 'family-table'].includes(task.id)).map((task) => taskFromTemplate(task, taskCategories.find((category) => category.tasks.some((candidate) => candidate.id === task.id))?.id));
const taskIcons = `⭐ 🌟 ✨ 💫 🔆 ☀️ 🌈 🌙 🌍 🌎 🌏 🪐 🚀 🛸 ☄️ 🔭 🧭 🎈 🎉 🎊 🎁 🏆 🥇 🥈 🥉 🎖️ 🏅 🏵️ 💎 💠 🔮 🧸 🪁 🪀 🪄 🎨 🖌️ 🖍️ ✏️ 📝 📚 📖 📕 📗 📘 📙 📒 📓 📔 📜 📰 🔤 🔠 🔡 🔢 🔣 📐 📏 ✂️ 📎 🖇️ 📌 📍 🧮 💻 🖥️ ⌨️ 🖱️ 📱 ☎️ 📷 📸 🎥 🎬 🎧 🎤 🎵 🎶 🎼 🎹 🥁 🎷 🎺 🎸 🪕 🎻 🪇 🪘 🪈 ⚽ 🏀 🏈 ⚾ 🎾 🏐 🏉 🎱 🏓 🏸 🏒 🏑 🥍 🏏 🥅 ⛳ 🏹 🎣 🤿 🥊 🥋 🎽 🛹 🛼 🛷 ⛸️ 🎿 🏂 🏋️ 🤸 🤹 🧘 🚴 🏃 🚶 🧗 🏊 🛝 🪂 🏄 🛶 🚣 🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🦉 🦋 🐌 🐞 🐢 🐍 🦎 🐙 🐠 🐬 🐳 🦕 🦖 🐝 🐛 🪲 🪴 🌱 🌿 🍀 🍃 🍂 🍁 🌵 🌳 🌲 🌴 🌷 🌹 🌺 🌻 🌼 🌸 💐 🍄 🌾 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🥑 🥕 🌽 🥦 🥒 🥔 🧅 🧄 🍞 🥐 🧀 🍕 🍔 🍟 🌭 🥪 🌮 🍣 🍜 🍪 🍩 🍰 🧁 🍦 🍭 🍬 🍫 🍿 🥛 🧃 ☕ 🫖 🍵 🏠 🏡 🏫 🏥 🏕️ ⛺ 🏖️ 🏝️ 🏞️ 🏔️ 🌋 🏙️ 🌆 🌇 🌉 🛤️ 🚂 🚃 🚄 🚅 🚆 🚇 🚈 🚉 🚊 🚝 🚞 🚋 🚌 🚍 🚎 🚐 🚑 🚒 🚓 🚕 🚗 🚙 🛻 🚚 🚛 🚜 🏎️ 🏍️ 🛵 🚲 🛴 🛹 🛺 🚁 ✈️ 🛩️ 🛫 🛬 🚀 ⛵ 🚤 🛥️ 🚢 ⚓`.split(' ');
const makeOccurrences = (library: StoredTask[], completed: string[]): Occurrence[] => library.filter((task) => task.enabled).map((task, index) => ({ id: `today-${task.id}`, template: { id: task.id, title: task.title, icon: task.icon || '⭐', baseXp: task.xp, steps: task.steps, supervision: 'none', timeStart: task.timeStart, timeEnd: task.timeEnd }, stage: 'learning', priority: Math.max(1, 10 - index), preferredTime: task.timeStart ?? ['09:00', '15:00', '18:00'][index], status: completed.includes(`today-${task.id}`) ? 'completed' : 'planned' }));

type TaskResult = { success: boolean; celebrate: boolean; title: string; message: string; xp: number; icon: string };
function createTaskResult(task: Occurrence, gender: Gender, level: AssistanceLevel, xp: number, language: Language): TaskResult {
  const success = level !== 'needs_help' && level !== 'not_completed';
  if (!success) return { success, celebrate: false, title: tr(language, 'result.thanks'), message: completedMessage(gender, level, language), xp, icon: '💛' };
  const celebrate = task.template.baseXp >= 15;
  const title = genderTr(language, celebrate ? 'result.hard' : 'result.success', gender);
  const message = xp > 0 ? genderTr(language, 'result.xp', gender, { count: xp }) : genderTr(language, 'result.independent', gender);
  return { success, celebrate, title, message, xp, icon: celebrate ? '🎉' : '🌟' };
}

export default function Home() {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [family, setFamily] = useState<FamilyState>({ ...defaultState, language: detectLanguage() });
  const language = family.language;
  const [now, setNow] = useState(() => new Date());
  const skipNextSave = useRef(false);
  const [loading, setLoading] = useState(true); const [parentMode, setParentMode] = useState(false); const [gate, setGate] = useState(false); const [gatePin, setGatePin] = useState(''); const [active, setActive] = useState<Occurrence | null>(null); const [taskResult, setTaskResult] = useState<TaskResult | null>(null);
  useEffect(() => { loadFamily().then((saved) => { const today = localDayKey(); const dayChanged = saved.taskDay !== today; setFamily({ ...saved, history: saved.history ?? [], customCategories: saved.customCategories ?? [], deletedCategoryIds: saved.deletedCategoryIds ?? [], taskLibrary: saved.taskLibrary.length ? saved.taskLibrary : starterTasks(), taskDay: today, completed: dayChanged ? [] : saved.completed }); setLoading(false); }); }, []);
  useEffect(() => { if (loading) return; if (skipNextSave.current) { skipNextSave.current = false; return; } void saveFamily(family); }, [family, loading]);
  useEffect(() => { if (loading) return; const timer = setInterval(() => { const date = new Date(); setNow(date); const day = localDayKey(date); setFamily((current) => current.taskDay === day ? current : { ...current, taskDay: day, completed: [] }); }, 30_000); return () => clearInterval(timer); }, [loading]);
  const tasks = useMemo(() => makeOccurrences(family.taskLibrary, family.completed), [family.taskLibrary, family.completed]);
  const uncompleted = useMemo(() => selectAvailable(tasks), [tasks]); const today = useMemo(() => uncompleted.filter((task) => isWithinTimeWindow(task.template.timeStart, task.template.timeEnd, now)), [uncompleted, now]); const outsideTimeWindow = useMemo(() => uncompleted.filter((task) => !isWithinTimeWindow(task.template.timeStart, task.template.timeEnd, now)), [uncompleted, now]); const pastDue = useMemo(() => outsideTimeWindow.filter(task => isPastTimeWindow(task.template.timeStart, task.template.timeEnd, now)), [outsideTimeWindow, now]); const upcoming = useMemo(() => outsideTimeWindow.filter(task => !isPastTimeWindow(task.template.timeStart, task.template.timeEnd, now)), [outsideTimeWindow, now]); const theme = paletteWithContrast(family.theme === 'custom' && family.customColors ? { ...family.customColors, label: 'Мои цвета', emoji: '🎨' } : themes[family.theme === 'custom' ? 'sunny' : family.theme]);
  const [childSettings, setChildSettings] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  function finish(level: AssistanceLevel) { if (!active) return; const completedTask = active; const outcome = level === 'needs_help' ? 'needs_help' : level === 'not_completed' ? 'not_completed' : 'success'; const award = calculateXp({ baseXp: active.template.baseXp, stage: active.stage, assistance: level, outcome, startedWithoutReminder: level === 'independent', newStepAttempted: false, earnedToday: family.history.filter((entry) => entry.date === localDayKey()).reduce((sum, entry) => sum + entry.xp, 0) }); const completedAt = new Date(); const entry: TaskHistoryEntry = { date: localDayKey(completedAt), time: `${String(completedAt.getHours()).padStart(2, '0')}:${String(completedAt.getMinutes()).padStart(2, '0')}`, taskId: active.template.id, title: active.template.title, icon: active.template.icon, result: level, xp: award.awarded }; setFamily((current) => ({ ...current, xp: current.xp + award.awarded, completed: outcome === 'success' ? [...new Set([...current.completed, active.id])] : current.completed, history: [...(current.history ?? []), entry] })); setTaskResult(createTaskResult(completedTask, family.gender, level, award.awarded, family.language)); setActive(null); }
  if (loading) return <SafeAreaView style={styles.safe}><Text style={styles.loading}>{tr(language, 'Загружаем семейный план…')}</Text></SafeAreaView>;
  if (!family.onboarded) return <LanguageContext.Provider value={language}><Onboarding onDone={setFamily} /></LanguageContext.Provider>;
  if (childSettings) return <LanguageContext.Provider value={language}><ChildSettings family={family} onChange={setFamily} onClose={() => setChildSettings(false)} /></LanguageContext.Provider>;
  if (active) return <LanguageContext.Provider value={language}><TaskScreen task={active} gender={family.gender} language={family.language} theme={theme} onBack={() => setActive(null)} onFinish={finish} /></LanguageContext.Provider>;
  return <LanguageContext.Provider value={language}><SafeAreaView style={[styles.safe, { backgroundColor: '#F4F7F6' }]}><StatusBar style="dark" />
    {parentMode ? <Animated.ScrollView entering={FadeIn.duration(240)} contentContainerStyle={[styles.page, isWide && { maxWidth: 1280, padding: 30 }]}><ParentPanel family={family} tasks={tasks} onClose={() => setParentMode(false)} onChange={setFamily} onAddTask={() => setTaskFormOpen(true)} onDelete={async () => { await deleteFamily(); skipNextSave.current = true; setFamily(defaultState); setParentMode(false); }} /></Animated.ScrollView> : <ChildDashboard family={family} theme={theme} today={today} later={upcoming} pastDue={pastDue} now={now} onTask={task => { const translated = translatedTask(family.language, task.template.id, task.template.title, [...task.template.steps]); setActive({ ...task, template: { ...task.template, ...translated } }); }} onSettings={() => setChildSettings(true)} onParent={() => setGate(true)} onAddTask={() => setTaskFormOpen(true)} />}
    <TaskCreationModal visible={taskFormOpen} family={family} onChange={setFamily} active={parentMode} onClose={() => setTaskFormOpen(false)} />
    <TaskResultModal result={taskResult} theme={theme} onClose={() => setTaskResult(null)} />
    {gate && <View style={screenUi.gateOverlay}><View style={screenUi.gateCard}><Text style={screenUi.gateTitle}>{tr(language, "Доступ для взрослого")}</Text><Text style={screenUi.gateHint}>{tr(language, "Введите PIN-код, чтобы открыть семейную панель.")}</Text><TextInput value={gatePin} onChangeText={value => setGatePin(value.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" secureTextEntry maxLength={4} placeholder="••••" style={screenUi.gateInput} /><Pressable style={screenUi.gateButton} onPress={() => { if (gatePin === family.pin) { setParentMode(true); setGate(false); setGatePin(''); } else Alert.alert(tr(language, 'PIN не подошёл')); }}><Text style={screenUi.gateButtonText}>{tr(language, "Открыть")}</Text></Pressable><Pressable onPress={() => { setGate(false); setGatePin(''); }} style={screenUi.gateCancel}><Text style={screenUi.gateCancelText}>{tr(language, "Отмена")}</Text></Pressable></View></View>}
  </SafeAreaView></LanguageContext.Provider>;
}

function Onboarding({ onDone }: { onDone: (state: FamilyState) => void }) {
  const language = useUiLanguage();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [age, setAge] = useState<FamilyState['ageBand'] | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [pin, setPin] = useState('');
  const ready = !!gender && !!age && pin.length === 4;
  return <SafeAreaView style={[styles.safe, { backgroundColor: '#F4F7F6' }]}><ScrollView contentContainerStyle={[onboardUi.page, wide && onboardUi.widePage]}>
    <View style={[onboardUi.layout, wide && onboardUi.wideLayout]}>
      <View style={onboardUi.intro}><Text style={onboardUi.brand}>{tr(language, "✦  Мой опыт")}</Text><Text style={onboardUi.introIcon}>🎈</Text><Text style={onboardUi.introTitle}>{tr(language, "Знакомство")}</Text><Text style={onboardUi.introText}>{tr(language, "Настроим приложение под вашего ребёнка. Это займёт всего пару минут.")}</Text><View style={onboardUi.introTip}><Text style={onboardUi.introTipText}>{tr(language, "Дела и награды можно будет изменить в родительской панели.")}</Text></View></View>
      <View style={onboardUi.form}><Text style={onboardUi.formTitle}>{tr(language, "Создадим семейный план")}</Text><Text style={onboardUi.label}>{tr(language, "Имя ребёнка")}</Text><TextInput value={name} onChangeText={setName} placeholder={tr(language, "Например, Аня")} style={onboardUi.input} /><Text style={onboardUi.label}>{tr(language, "Обращение")}</Text><View style={onboardUi.options}><Pressable onPress={() => setGender('female')} style={[onboardUi.option, gender === 'female' && onboardUi.selected]}><Text style={onboardUi.optionText}>{tr(language, "Девочка")}</Text></Pressable><Pressable onPress={() => setGender('male')} style={[onboardUi.option, gender === 'male' && onboardUi.selected]}><Text style={onboardUi.optionText}>{tr(language, "Мальчик")}</Text></Pressable></View><Text style={onboardUi.label}>{tr(language, "Возрастная группа")}</Text><View style={onboardUi.options}>{([['age_5_6', '5–6 лет'], ['age_7_8', '7–8 лет'], ['age_9', '9 лет']] as const).map(([value, label]) => <Pressable key={value} onPress={() => setAge(value)} style={[onboardUi.option, age === value && onboardUi.selected]}><Text style={onboardUi.optionText}>{tr(language, label)}</Text></Pressable>)}</View><DifficultyPicker value={difficulty} onChange={setDifficulty} /><Text style={onboardUi.label}>{tr(language, "PIN взрослого · 4 цифры")}</Text><TextInput value={pin} onChangeText={value => setPin(value.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" secureTextEntry maxLength={4} placeholder="••••" style={onboardUi.input} /><Pressable disabled={!ready} style={[onboardUi.submit, !ready && styles.disabled]} onPress={() => onDone({ ...defaultState, onboarded: true, name: name.trim(), gender: gender!, ageBand: age!, difficulty, pin, taskLibrary: starterTasks() })}><Text style={onboardUi.submitText}>{tr(language, "Начать →")}</Text></Pressable></View>
    </View>
  </ScrollView></SafeAreaView>;
}
function TaskScreen({ task, gender, language, theme, onBack, onFinish }: { task: Occurrence; gender: Gender; language: Language; theme: ReturnType<typeof paletteWithContrast<typeof themes.sunny>>; onBack: () => void; onFinish: (level: AssistanceLevel) => void }) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}><Animated.ScrollView entering={FadeInDown.duration(260)} contentContainerStyle={[styles.page, wide && { maxWidth: 1040, padding: 30 }]}>
    <Pressable onPress={onBack} style={[taskUi.backButton, { backgroundColor: theme.surface, borderColor: theme.soft }]} accessibilityRole="button" accessibilityLabel={tr(language, 'task.back')}><View style={taskUi.backChevron}><View style={[taskUi.backChevronStroke, taskUi.backChevronUpper, { backgroundColor: theme.primary }]} /><View style={[taskUi.backChevronStroke, taskUi.backChevronLower, { backgroundColor: theme.primary }]} /></View><Text style={[taskUi.backText, { color: theme.text }]}>{tr(language, 'task.back')}</Text></Pressable>
    <View style={[taskUi.hero, { backgroundColor: theme.surface }]}><View style={[taskUi.heroIcon, { backgroundColor: theme.soft }]}><Text style={taskUi.heroEmoji}>{task.template.icon}</Text></View><View style={taskUi.heroText}><Text style={[taskUi.eyebrow, { color: theme.primary }]}>{tr(language, "МОЁ ДЕЛО · +")}{task.template.baseXp} XP</Text><Text style={[taskUi.title, { color: theme.text }]}>{task.template.title}</Text><Text style={[taskUi.hint, { color: theme.muted }]}>{tr(language, "Делай в своём темпе. Телефон можно отложить.")}</Text></View></View>
    <View style={[taskUi.columns, wide && taskUi.wideColumns]}>
      <View style={taskUi.column}><Text style={[taskUi.sectionTitle, { color: theme.backgroundText }]}>{tr(language, 'task.what')}</Text><View style={[taskUi.card, { backgroundColor: theme.surface }]}>{task.template.steps.map((step, index) => <View style={taskUi.step} key={`${step}-${index}`}><Text style={[taskUi.stepNumber, { backgroundColor: theme.soft, color: theme.softText }]}>{index + 1}</Text><Text style={[taskUi.stepText, { color: theme.text }]}>{step}</Text></View>)}</View><View style={[taskUi.note, { backgroundColor: theme.soft }]}><Text style={[taskUi.noteText, { color: theme.softText }]}>{tr(language, 'task.note')}</Text></View></View>
      <View style={taskUi.column}><Text style={taskUi.sectionTitle}>{tr(language, 'task.how')}</Text><Text style={taskUi.sub}>{tr(language, 'task.saved')}</Text><Choice label={genderTr(language, 'tasks.done', gender)} color="#E6F5EC" onPress={() => onFinish('independent')} /><Choice label={language === 'ru' ? 'Понадобилась подсказка' : language === 'en' ? 'I needed a hint' : language === 'es' ? 'Necesité una pista' : 'J’ai eu besoin d’un indice'} color="#FFF4DD" onPress={() => onFinish('reminder')} /><Choice label={language === 'ru' ? 'Мы сделали вместе' : language === 'en' ? 'We did it together' : language === 'es' ? 'Lo hicimos juntos' : 'Nous l’avons fait ensemble'} color="#EAF0FF" onPress={() => onFinish('together')} /><Choice label={language === 'ru' ? 'Нужна помощь' : language === 'en' ? 'I need help' : language === 'es' ? 'Necesito ayuda' : 'J’ai besoin d’aide'} color="#F2EAFE" onPress={() => onFinish('needs_help')} /><Choice label={language === 'ru' ? 'Пока не получилось' : language === 'en' ? 'I couldn’t do it yet' : language === 'es' ? 'Aún no lo conseguí' : 'Je n’y suis pas encore arrivé'} color="#F0F2F1" onPress={() => onFinish('not_completed')} /></View>
    </View>
  </Animated.ScrollView></SafeAreaView>;
}
function TaskResultModal({ result, theme, onClose }: { result: TaskResult | null; theme: ReturnType<typeof paletteWithContrast<typeof themes.sunny>>; onClose: () => void }) {
  const language = useUiLanguage();
  if (!result) return null;
  const { width, height } = useWindowDimensions();
  const fireworkSpots = [
    { left: '0%', top: height * 0.05 }, { left: '32%', top: height * 0.08 }, { left: '64%', top: height * 0.04 },
    { left: '0%', top: height * 0.23 }, { left: '32%', top: height * 0.27 }, { left: '64%', top: height * 0.22 },
    { left: '0%', top: height * 0.42 }, { left: '32%', top: height * 0.46 }, { left: '64%', top: height * 0.41 },
    { left: '0%', top: height * 0.61 }, { left: '32%', top: height * 0.65 }, { left: '64%', top: height * 0.60 },
    { left: '0%', top: height * 0.79 }, { left: '32%', top: height * 0.83 }, { left: '64%', top: height * 0.77 },
  ] as const;
  return <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
    <View style={resultUi.overlay}>
      {result.celebrate && <View pointerEvents="none" style={resultUi.fullScreenCelebration}>
        {Array.from({ length: 126 }, (_, index) => <FallingConfetti key={index} index={index} screenHeight={height} />)}
        {fireworkSpots.map((spot, index) => <FireworkBurst key={index} left={spot.left} top={spot.top} delay={index * 720} cycleDuration={fireworkSpots.length * 720} />)}
        <Text style={[resultUi.screenFirework, { left: width * 0.72, top: height * 0.43 }]}>✨</Text><Text style={[resultUi.screenFirework, { left: width * 0.12, top: height * 0.48 }]}>🌟</Text>
      </View>}
      <Animated.View entering={FadeInDown.duration(260).springify()} style={[resultUi.card, { backgroundColor: theme.surface, borderColor: theme.soft }]} accessibilityViewIsModal>
        {result.celebrate && <><ModalFanfare side="left" delay={0} /><ModalFanfare side="right" delay={260} /></>}
        <View style={[resultUi.simpleArt, { backgroundColor: theme.soft }]}><Text style={resultUi.resultIcon}>{result.icon}</Text></View>
        <Text style={[resultUi.title, { color: theme.text }]}>{result.title}</Text>
        <Text style={[resultUi.message, { color: theme.muted }]}>{result.message}</Text>
        {result.success && result.xp > 0 && <View style={[resultUi.reward, { backgroundColor: theme.soft }]}><Text style={[resultUi.rewardText, { color: theme.softText }]}>＋{result.xp} XP</Text></View>}
        <Pressable onPress={onClose} style={[resultUi.button, { backgroundColor: theme.primary }]} accessibilityRole="button"><Text style={resultUi.buttonText}>{tr(language, result.success ? 'Ура!' : 'Понятно')}</Text></Pressable>
      </Animated.View>
    </View>
  </Modal>;
}

function FireworkBurst({ left, top, delay, cycleDuration }: { left: `${number}%`; top: number; delay: number; cycleDuration: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 580, easing: Easing.out(Easing.cubic) }), withTiming(0, { duration: 0 }), withDelay(cycleDuration - 580, withTiming(0, { duration: 0 }))), -1, false));
    return () => cancelAnimation(progress);
  }, [cycleDuration, delay, progress]);
  const colors = ['#FF7043', '#FFD54F', '#42A5F5', '#AB47BC', '#66BB6A', '#EC407A'];
  return <View pointerEvents="none" style={[resultUi.fireworkBurst, { left, top }]}>{Array.from({ length: 12 }, (_, index) => <FireworkSpark key={index} index={index} progress={progress} color={colors[index % colors.length]} />)}</View>;
}

function FireworkSpark({ index, progress, color }: { index: number; progress: SharedValue<number>; color: string }) {
  const angle = index * 30;
  const radians = angle * Math.PI / 180;
  const animatedStyle = useAnimatedStyle(() => {
    const value = progress.value;
    return { opacity: value < 0.04 ? 0 : 1 - value, transform: [{ translateX: Math.cos(radians) * 34 * value }, { translateY: Math.sin(radians) * 34 * value }, { rotate: `${angle}deg` }, { scale: 0.65 + value * 0.55 }] };
  });
  return <Animated.View style={[resultUi.fireworkSpark, { backgroundColor: color }, animatedStyle]} />;
}

function FallingConfetti({ index, screenHeight }: { index: number; screenHeight: number }) {
  const progress = useSharedValue(0);
  const delay = index * 75;
  useEffect(() => {
    progress.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 1500 + (index % 5) * 170, easing: Easing.linear }), withTiming(0, { duration: 0 })), -1, false));
    return () => cancelAnimation(progress);
  }, [delay, index, progress]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: 0.35 + Math.sin(Math.PI * progress.value) * 0.65, transform: [{ translateY: progress.value * screenHeight * 0.28 }, { rotate: `${progress.value * (index % 2 ? 300 : -300)}deg` }] }));
  const colors = ['#FF7043', '#FFD54F', '#42A5F5', '#AB47BC', '#66BB6A', '#EC407A', '#26A69A'];
  return <Animated.View style={[resultUi.confettiPiece, { left: `${(index * 41 + 7) % 96}%`, top: (index * 67) % Math.max(screenHeight - 20, 1), width: index % 3 === 0 ? 6 : 8, height: index % 4 === 0 ? 8 : 13, backgroundColor: colors[index % colors.length] }, animatedStyle]} />;
}

function ModalFanfare({ side, delay }: { side: 'left' | 'right'; delay: number }) {
  const blowing = useSharedValue(0);
  useEffect(() => {
    blowing.value = withDelay(delay, withRepeat(withTiming(1, { duration: 340, easing: Easing.inOut(Easing.ease) }), -1, true));
    return () => cancelAnimation(blowing);
  }, [blowing, delay]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: blowing.value * -3 }, { rotate: `${(blowing.value - 0.5) * (side === 'left' ? -12 : 12)}deg` }, { scaleX: side === 'right' ? -1 : 1 }] }));
  const soundWaveStyle = useAnimatedStyle(() => ({ opacity: 0.2 + blowing.value * 0.8, transform: [{ scale: 0.7 + blowing.value * 0.55 }] }));
  const goldId = `fanfare-gold-${side}`;
  const redId = `fanfare-red-${side}`;
  return <Animated.View pointerEvents="none" style={[resultUi.fanfare, side === 'left' ? resultUi.fanfareLeft : resultUi.fanfareRight, animatedStyle]}>
    <Svg width={178} height={130} viewBox="0 0 178 130">
      <Defs>
        <LinearGradient id={goldId} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#FFF3A6"/><Stop offset="0.42" stopColor="#F7C52E"/><Stop offset="0.72" stopColor="#D88908"/><Stop offset="1" stopColor="#FFF0A0"/></LinearGradient>
        <LinearGradient id={redId} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#FF4D55"/><Stop offset="0.48" stopColor="#DF1634"/><Stop offset="1" stopColor="#A90029"/></LinearGradient>
      </Defs>
      <Path d="M14 38H29C43 38 40 21 59 21H94C105 21 106 35 117 35" fill="none" stroke={`url(#${goldId})`} strokeWidth={12} strokeLinecap="round"/>
      <Path d="M28 43C27 65 39 76 57 76H84C101 76 108 63 117 50" fill="none" stroke={`url(#${goldId})`} strokeWidth={10} strokeLinecap="round"/>
      <Path d="M16 34H31C44 34 43 18 60 18H88" fill="none" stroke="#FFF7C4" strokeWidth={2.2} strokeLinecap="round" opacity={0.85}/>
      <Ellipse cx={13} cy={38} rx={6} ry={6} fill={`url(#${goldId})`}/>
      <Rect x={59} y={14} width={36} height={15} rx={5} fill={`url(#${redId})`} stroke="#D9940B" strokeWidth={2.5}/>
      <Path d="M108 28C125 28 132 18 148 9L157 7V59L148 57C132 48 125 39 108 39Z" fill={`url(#${goldId})`} stroke="#D38A08" strokeWidth={2}/>
      <Ellipse cx={155} cy={33} rx={4} ry={23} fill="#A85E07"/><Ellipse cx={153} cy={33} rx={2} ry={17} fill="#FFE27A" opacity={0.8}/>
      <Path d="M55 51H97V113L76 102L55 113Z" fill={`url(#${redId})`} stroke={`url(#${goldId})`} strokeWidth={4} strokeLinejoin="round"/>
      <Path d="M58 54H94" stroke="#FFB54B" strokeWidth={2} opacity={0.8}/>
      <Polygon points="76,65 80,73 89,74 82,80 84,89 76,85 68,89 70,80 63,74 72,73" fill="#FFD849" stroke="#F5B91C" strokeWidth={1.5} strokeLinejoin="round"/>
      <Path d="M61 95L61 107M90 94L90 107" stroke="#FF8A85" strokeWidth={1.5} opacity={0.75}/>
    </Svg>
    <Animated.View style={[resultUi.soundWaves, soundWaveStyle]}><Svg width={34} height={62} viewBox="0 0 34 62"><Path d="M2 7Q23 31 2 55" fill="none" stroke="#FFE477" strokeWidth={3} strokeLinecap="round"/><Path d="M13 2Q39 31 13 60" fill="none" stroke="#FFD044" strokeWidth={2.5} strokeLinecap="round"/></Svg></Animated.View>
  </Animated.View>;
}

const resultUi = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(28, 35, 30, 0.58)', justifyContent: 'center', alignItems: 'center', padding: 22 }, fullScreenCelebration: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' }, screenFirework: { position: 'absolute', fontSize: 35 },
  card: { width: '100%', maxWidth: 370, borderRadius: 26, borderWidth: 2, paddingHorizontal: 24, paddingTop: 18, paddingBottom: 22, alignItems: 'center', overflow: 'visible', gap: 10, ...Platform.select({ web: { boxShadow: '0 14px 42px rgba(20,30,24,0.24)' }, default: { elevation: 10, shadowColor: '#1F2933', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } } }) }, fanfare: { position: 'absolute', top: -43, width: 178, height: 130, zIndex: 5 }, fanfareLeft: { left: -42 }, fanfareRight: { right: -42 }, soundWaves: { position: 'absolute', left: 143, top: 14 },
  confettiPiece: { position: 'absolute', width: 7, height: 12, borderRadius: 2 }, fireworkBurst: { position: 'absolute', width: 80, height: 80 }, fireworkSpark: { position: 'absolute', left: '50%', top: '50%', width: 4, height: 10, borderRadius: 3, marginLeft: -2, marginTop: -5 },
  simpleArt: { width: 76, height: 76, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginVertical: 7 }, resultIcon: { fontSize: 52, textAlign: 'center' }, title: { fontSize: 21, lineHeight: 27, fontWeight: '900', textAlign: 'center', marginTop: 2 }, message: { fontSize: 14, lineHeight: 20, fontWeight: '600', textAlign: 'center' }, reward: { marginTop: 2, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14 }, rewardText: { fontSize: 17, fontWeight: '900' }, button: { minHeight: 48, width: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: 15, paddingHorizontal: 16, marginTop: 5 }, buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});

function Choice({ label, color, onPress }: { label: string; color: string; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.choice, { backgroundColor: color }]} accessibilityRole="button"><Text style={styles.choiceText}>{label}</Text><Text style={styles.chevron}>›</Text></Pressable>; }

function TaskCreationModal({ visible, family, onChange, active, onClose }: { visible: boolean; family: FamilyState; onChange: (state: FamilyState) => void; active: boolean; onClose: () => void }) {
  const language = family.language;
  const [title, setTitle] = useState(''); const [icon, setIcon] = useState('⭐'); const [categoryId, setCategoryId] = useState(''); const [timeStart, setTimeStart] = useState(''); const [timeEnd, setTimeEnd] = useState(''); const [xp, setXp] = useState('5'); const [newCategory, setNewCategory] = useState(''); const [newCategoryIcon, setNewCategoryIcon] = useState('📁');
  const categories: StoredCategory[] = [...taskCategories.map(({ id, title: categoryTitle, icon: categoryIcon }) => ({ id, title: categoryTitle, icon: categoryIcon })), ...(family.customCategories ?? [])].filter(category => !(family.deletedCategoryIds ?? []).includes(category.id));
  const reset = () => { setTitle(''); setIcon('⭐'); setCategoryId(categories[0]?.id ?? ''); setTimeStart(''); setTimeEnd(''); setXp('5'); setNewCategory(''); setNewCategoryIcon('📁'); };
  const addCategory = () => { const name = newCategory.trim(); if (!name) return; const category = { id: `category-${Date.now()}`, title: name, icon: newCategoryIcon }; onChange({ ...family, customCategories: [...(family.customCategories ?? []), category] }); setCategoryId(category.id); setNewCategory(''); setNewCategoryIcon('📁'); };
  const save = () => { const name = title.trim(); if (!name) { Alert.alert(tr(language, 'Введите название дела')); return; } if (!categories.some(category => category.id === categoryId)) { Alert.alert(tr(language, 'Выберите или создайте категорию')); return; } const start = /^([01]\d|2[0-3]):[0-5]\d$/.test(timeStart) ? timeStart : undefined; const end = /^([01]\d|2[0-3]):[0-5]\d$/.test(timeEnd) ? timeEnd : undefined; const entry: StoredTask = { id: `custom-${Date.now()}`, title: name, icon, xp: normalizeTaskXp(xp), steps: [tr(language, 'Сделай дело в своём темпе'), tr(language, 'Отметь, как получилось')], enabled: active, categoryId, timeStart: start, timeEnd: end }; onChange({ ...family, taskLibrary: [...family.taskLibrary, entry] }); reset(); onClose(); };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { reset(); onClose(); }} onShow={() => setCategoryId(categories.some(item => item.id === categoryId) ? categoryId : categories[0]?.id ?? '')}><View style={modalUi.overlay}><View style={modalUi.sheet}><ScrollView keyboardShouldPersistTaps="always" contentContainerStyle={modalUi.form}><View style={modalUi.titleRow}><Text style={modalUi.title}>{tr(language, "Добавить своё дело")}</Text><Pressable onPress={() => { reset(); onClose(); }} accessibilityLabel={tr(language, "Закрыть")}><Text style={modalUi.close}>×</Text></Pressable></View><TextInput value={title} onChangeText={setTitle} placeholder={tr(language, "Например, покормить кота")} style={modalUi.titleInput}/><CategoryPicker categories={categories} selected={categoryId} onSelect={setCategoryId}/><View style={modalUi.newCategoryRow}><TextInput value={newCategory} onChangeText={setNewCategory} placeholder={tr(language, "＋ Новая категория")} style={modalUi.newCategoryInput}/><Pressable onPress={addCategory}><Text style={modalUi.newCategoryButton}>{tr(language, "＋ Создать")}</Text></Pressable></View>{!!newCategory.trim() && <View style={modalUi.categoryIconPicker}><Text style={modalUi.label}>{tr(language, "Значок новой категории")}</Text><IconPicker selected={newCategoryIcon} onSelect={setNewCategoryIcon} label={tr(language, "Выбрать значок категории")}/></View>}<IconPicker selected={icon} onSelect={setIcon}/><Text style={modalUi.label}>{tr(language, "Время доступности · необязательно")}</Text><View style={modalUi.timeRow}><TextInput value={timeStart} onChangeText={value => setTimeStart(value.slice(0,5))} placeholder={tr(language, "С 08:00")} maxLength={5} style={modalUi.timeInput}/><TextInput value={timeEnd} onChangeText={value => setTimeEnd(value.slice(0,5))} placeholder={tr(language, "До 20:00")} maxLength={5} style={modalUi.timeInput}/></View><TextInput value={xp} onChangeText={value => setXp(value.replace(/\D/g, '').slice(0,3))} placeholder={tr(language, "Опыт · 5 XP")} keyboardType="number-pad" style={modalUi.xpInput}/><Pressable style={modalUi.submit} onPress={save}><Text style={modalUi.submitText}>{tr(language, "＋ Добавить дело")}</Text></Pressable>{!active && <Text style={modalUi.note}>{tr(language, "Предложение появится в списке взрослого как скрытое дело.")}</Text>}</ScrollView></View></View></Modal>;
}

function DifficultyPicker({ value, onChange }: { value: Difficulty; onChange: (value: Difficulty) => void }) {
  const language = useUiLanguage();
  return <View style={styles.difficultyPicker}>
    <Text style={styles.parentHeading}>{tr(language, "Уровень сложности")}</Text>
    <Text style={styles.parentText}>{tr(language, "Каждые 50 XP улучшают звезду. После сияющих открывается премиальный уровень.")}</Text>
    <View style={styles.difficultyOptions}>{difficultyOptions.map((option) => <Pressable key={option.value} onPress={() => onChange(option.value)} accessibilityRole="radio" accessibilityState={{ checked: value === option.value }} style={[styles.difficultyOption, value === option.value && styles.difficultyOptionSelected]}><Text style={styles.difficultyOptionTitle}>{translatedDifficulty(language, option.value, option.label)}</Text><Text style={styles.difficultyOptionDetail}>{option.stars} {' '}{tr(language, "× 3 уровня")}</Text></Pressable>)}</View>
  </View>;
}

function StarDesignPicker({ level, value, onChange }: { level: 2 | 3; value: string; onChange: (value: string) => void }) {
  const language = useUiLanguage();
  const designs = level === 2 ? secondStarDesigns : thirdStarDesigns;
  return <View style={styles.starDesignSection}>
    <Text style={styles.parentHeading}>{tr(language, level === 2 ? 'Сияющие звёзды' : 'Премиальные звёзды')}</Text>
    <Text style={styles.parentText}>{tr(language, level === 2 ? 'Дизайн второго уровня' : 'Дизайн третьего уровня')} · {designs.length} {' '}{tr(language, "вариантов. Выбранная звезда показывает анимацию.")}</Text>
    <View style={styles.starDesignGrid}>{designs.map((design, index) => <Pressable key={design.id} onPress={() => onChange(design.id)} accessibilityRole="radio" accessibilityState={{ checked: value === design.id }} accessibilityLabel={tr(language, 'Выбрать звезду {{name}}, уровень {{level}}', { name: translatedStarDesign(language, design.id, design.name), level })} style={[styles.starDesignTile, value === design.id && styles.starDesignTileSelected]}>
      <StarIcon language={language} index={index} filled stage={level} muted="#8B8278" secondDesign={design.id} thirdDesign={design.id} preview={value !== design.id} />
      <Text style={styles.starDesignLabel}>{translatedStarDesign(language, design.id, design.name)}</Text>
    </Pressable>)}</View>
  </View>;
}

function ChildSettings({ family, onChange, onClose }: { family: FamilyState; onChange: (state: FamilyState) => void; onClose: () => void }) {
  const language = family.language;
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [settingsTab, setSettingsTab] = useState<'themes' | 'stars'>('themes');
  const defaultColors = { background: '#FFF7E6', surface: '#FFFFFF', primary: '#F28A38', soft: '#FFE3A5', text: '#3B2A1D', muted: '#735E4D' };
  const [draftTheme, setDraftTheme] = useState(family.theme);
  const [colors, setColors] = useState(family.theme === 'custom' ? family.customColors ?? defaultColors : themes[family.theme]);
  const selected = draftTheme === 'custom' ? null : themeList.find((item) => item.id === draftTheme) ?? themeList[0];
  const preview = paletteWithContrast(draftTheme === 'custom' ? colors : (selected ?? themeList[0]));
  const colorFields = [['background', 'Фон'], ['primary', 'Главный цвет'], ['soft', 'Мягкий цвет']] as const;
  const presets = Array.from(new Set([...themeList.flatMap((item) => [item.background, item.primary, item.soft]), '#FFFFFF', '#F5F5F4', '#E5E7EB', '#9CA3AF', '#6B7280', '#374151', '#111827', '#000000', '#FFF7ED', '#FFEDD5', '#FED7AA', '#FB923C', '#C2410C', '#FEF2F2', '#FECACA', '#F87171', '#B91C1C', '#FDF2F8', '#FBCFE8', '#EC4899', '#9D174D', '#F5F3FF', '#DDD6FE', '#A78BFA', '#6D28D9', '#EEF2FF', '#C7D2FE', '#818CF8', '#4338CA', '#EFF6FF', '#BFDBFE', '#60A5FA', '#1D4ED8', '#ECFEFF', '#A5F3FC', '#22D3EE', '#0E7490', '#ECFDF5', '#A7F3D0', '#34D399', '#047857', '#F7FEE7', '#D9F99D', '#84CC16', '#4D7C0F', '#FEFCE8', '#FEF08A', '#FACC15', '#A16207']));
  const updateDraftColors = (nextColors: typeof defaultColors) => { setColors(nextColors); setDraftTheme('custom'); };
  const selectTheme = (item: typeof themeList[number]) => {
    const nextColors = { background: item.background, surface: item.surface, primary: item.primary, soft: item.soft, text: item.text, muted: item.muted };
    setColors(nextColors);
    setDraftTheme(item.id);
  };
  return <SafeAreaView style={[styles.safe, { backgroundColor: '#F4F7F6' }]}>
    <Animated.ScrollView entering={FadeInDown.duration(260)} contentContainerStyle={[styles.page, wide && { maxWidth: 1120, padding: 28 }]}>
      <Pressable onPress={onClose}><Text style={[styles.back, { color: '#2B8A6E' }]}>{tr(family.language, 'settings.back')}</Text></Pressable>
      <Text style={[styles.section, { color: '#1E2923', fontSize: 24 }]}>{tr(family.language, 'settings.title')}</Text>
      <View style={settingsUi.info}><Text style={settingsUi.heading}>{tr(family.language, 'settings.language')}</Text><View style={onboardUi.options}>{(Object.keys(languageNames) as Language[]).map(language => <Pressable key={language} onPress={() => onChange({ ...family, language })} style={[onboardUi.option, family.language === language && onboardUi.selected]}><Text style={onboardUi.optionText}>{languageNames[language]}</Text></Pressable>)}</View></View>
      <Text style={[styles.parentText, { color: '#64748B', fontSize: 13 }]}>{tr(family.language, 'settings.subtitle')}</Text>
      <View style={styles.childTabs}><Pressable style={[styles.childTab, settingsTab === 'themes' && { backgroundColor: '#2B8A6E' }]} onPress={() => setSettingsTab('themes')}><Text style={[styles.childTabText, { color: settingsTab === 'themes' ? '#FFFFFF' : '#64748B' }]}>{tr(family.language, 'settings.tabThemes')}</Text></Pressable><Pressable style={[styles.childTab, settingsTab === 'stars' && { backgroundColor: '#2B8A6A' }]} onPress={() => setSettingsTab('stars')}><Text style={[styles.childTabText, { color: settingsTab === 'stars' ? '#FFFFFF' : '#64748B' }]}>{tr(family.language, 'settings.tabStars')}</Text></Pressable></View>
      <Animated.View key={settingsTab} entering={FadeInDown.duration(230)} exiting={FadeOut.duration(140)}>{settingsTab === 'themes' ? <View style={[settingsUi.layout, wide && settingsUi.wideLayout]}>
        <View style={settingsUi.main}><Text style={settingsUi.heading}>{tr(family.language, 'settings.readyThemes')}</Text><View style={styles.themeGrid}>{themeList.map(item => <Pressable key={item.id} onPress={() => selectTheme(item)} style={[styles.themeTile, { backgroundColor: item.background, borderColor: draftTheme === item.id ? item.primary : '#E5EAE6', borderWidth: 2 }]}><Text style={styles.themeEmoji}>{item.emoji}</Text><Text style={[styles.themeText, { color: readableText(item.background) }]}>{translatedTheme(family.language, item.id, item.label)}</Text><View style={styles.themeSwatches}>{[item.background, item.primary, item.soft].map(color => <View key={color} style={[styles.themeDot, { backgroundColor: color }]} />)}</View></Pressable>)}</View><Text style={settingsUi.heading}>{tr(family.language, 'settings.customColors')}</Text><Text style={settingsUi.helper}>{tr(family.language, 'settings.colorHint')}</Text>{colorFields.map(([key, label]) => <View key={key} style={styles.colorRow}><Text style={styles.colorLabel}>{tr(family.language, label)}</Text><View style={styles.swatches}>{presets.map(color => <Pressable key={`${key}-${color}`} onPress={() => updateDraftColors({ ...colors, [key]: color })} style={[styles.swatch, { backgroundColor: color }, colors[key] === color && styles.swatchSelected]} accessibilityLabel={`${tr(family.language, label)}: ${color}`} />)}<TextInput value={colors[key]} onChangeText={value => { if (/^#[0-9a-fA-F]{6}$/.test(value)) updateDraftColors({ ...colors, [key]: value.toUpperCase() }); }} maxLength={7} autoCapitalize="characters" style={styles.hexInput} /></View></View>)}</View>
        <View style={[settingsUi.previewColumn, wide && { width: 320 }]}><View style={[styles.previewCard, { backgroundColor: preview.surface }]}><Text style={[styles.previewEyebrow, { color: preview.muted }]}>{tr(family.language, 'settings.preview')}</Text><Text style={[styles.previewTitle, { color: preview.text }]}>{selected?.emoji ?? '🎨'}  {tr(family.language, 'settings.greeting')}{family.name ? `, ${family.name}` : ''}!</Text><Text style={[styles.parentText, { color: preview.muted }]}>{tr(family.language, 'settings.todayTasks')}</Text><View style={[styles.previewTask, { backgroundColor: preview.soft }]}><Text style={{ fontSize: 23 }}>🪴</Text><View style={styles.cardBody}><Text style={[styles.previewTaskTitle, { color: preview.softText }]}>{tr(family.language, 'settings.waterPlant')}</Text><Text style={{ color: preview.softMuted }}>+5 XP</Text></View><Text style={{ color: preview.primary, fontSize: 24 }}>›</Text></View><View style={[styles.previewProgress, { backgroundColor: preview.soft }]}><View style={{ width: '58%', height: 8, borderRadius: 5, backgroundColor: preview.primary }} /></View></View><Pressable style={[styles.startButton, { backgroundColor: '#2B8A6E' }]} onPress={() => { onChange({ ...family, theme: draftTheme, customColors: colors }); onClose(); }}><Text style={styles.startButtonText}>{tr(family.language, 'settings.save')}</Text></Pressable></View>
      </View> : <View style={settingsUi.main}><View style={settingsUi.info}><Text style={settingsUi.heading}>{tr(family.language, 'child.starGuide')}</Text><Text style={settingsUi.helper}>{tr(family.language, 'settings.starRule')}</Text></View><StarDesignPicker level={2} value={family.secondStarDesign} onChange={secondStarDesign => onChange({ ...family, secondStarDesign })} /><StarDesignPicker level={3} value={family.thirdStarDesign} onChange={thirdStarDesign => onChange({ ...family, thirdStarDesign })} /><Pressable style={[styles.startButton, { backgroundColor: '#2B8A6E' }]} onPress={onClose}><Text style={styles.startButtonText}>{tr(family.language, 'settings.done')}</Text></Pressable></View>}
      </Animated.View>
    </Animated.ScrollView>
  </SafeAreaView>;
}function ParentPanel({ tasks, family, onClose, onChange, onDelete, onAddTask }: { tasks: Occurrence[]; family: FamilyState; onClose: () => void; onChange: (state: FamilyState) => void; onDelete: () => Promise<void>; onAddTask: () => void }) {
  const language = family.language;
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [section, setSection] = useState<'overview' | 'tasks' | 'stars' | 'history' | 'data'>('overview');
  const [taskSearch, setTaskSearch] = useState('');
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false); const [showHistory, setShowHistory] = useState(false); const categories: StoredCategory[] = useMemo(() => [...taskCategories.map(({ id, title, icon }) => ({ id, title, icon })), ...(family.customCategories ?? [])].filter(category => !(family.deletedCategoryIds ?? []).includes(category.id)), [family.customCategories, family.deletedCategoryIds]); const [editing, setEditing] = useState<string | null>(null); const [catalogEditing, setCatalogEditing] = useState<string | null>(null); const [expanded, setExpanded] = useState<string | null>(null); const [confirmCategoryDelete, setConfirmCategoryDelete] = useState<string | null>(null); const done = tasks.filter((task) => task.status === 'completed').length;
  const updateTask = (id: string, patch: Partial<StoredTask>) => onChange({ ...family, taskLibrary: family.taskLibrary.map((task) => task.id === id ? { ...task, ...patch } : task) }); const addTask = (task: StoredTask) => onChange({ ...family, taskLibrary: [...family.taskLibrary, task] });
  const toggleCatalogTask = (template: TaskTemplate, categoryId: string) => { const existing = family.taskLibrary.find((task) => task.id === template.id); if (existing) updateTask(existing.id, { enabled: !existing.enabled }); else addTask(taskFromTemplate({ ...template, ...translatedTask(family.language, template.id, template.title, [...template.steps]) }, categoryId)); };
  const editCatalogTask = (template: TaskTemplate, categoryId: string) => { if (!family.taskLibrary.some((task) => task.id === template.id)) addTask({ ...taskFromTemplate(template, categoryId), enabled: false }); setCatalogEditing(template.id); };
  const catalogIds = new Set(catalog.map((template) => template.id));
  const removeCategory = (categoryId: string) => { onChange({ ...family, customCategories: (family.customCategories ?? []).filter((category) => category.id !== categoryId), deletedCategoryIds: [...new Set([...(family.deletedCategoryIds ?? []), categoryId])], taskLibrary: family.taskLibrary.filter((task) => task.categoryId !== categoryId) }); setExpanded(null); setConfirmCategoryDelete(null); };
  const exportData = async () => {
    const json = JSON.stringify(family, null, 2);
    if (Platform.OS === 'web') {
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'moy-vklad-export.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      return;
    }
    const uri = `${FileSystem.cacheDirectory}moy-vklad-export.json`;
    await FileSystem.writeAsStringAsync(uri, json);
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
  };
  const importData = async () => {
    try {
      if (Platform.OS === 'web') { Alert.alert(tr(language, 'Импорт JSON'), tr(language, 'Откройте приложение на Android, чтобы выбрать файл.')); return; }
      const access = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!access.granted) return;
      const files = (await FileSystem.StorageAccessFramework.readDirectoryAsync(access.directoryUri)).filter((uri) => uri.toLowerCase().endsWith('.json'));
      if (!files.length) { Alert.alert(tr(language, 'JSON не найден'), tr(language, 'В выбранной папке нет файлов .json.')); return; }
      const applyFile = async (uri: string) => {
        try {
          const parsed: unknown = JSON.parse(await FileSystem.readAsStringAsync(uri));
          if (!parsed || typeof parsed !== 'object' || !('taskLibrary' in parsed) || !Array.isArray(parsed.taskLibrary) || !('name' in parsed) || !('pin' in parsed)) throw new Error(tr(language, 'Файл не похож на экспорт «Мой опыт».'));
          const imported = parsed as Partial<FamilyState> & { initialXp?: number };
          delete imported.initialXp;
          const today = localDayKey();
          onChange({ ...defaultState, ...imported, difficulty: normalizeDifficulty(imported.difficulty), secondStarDesign: normalizeStarDesign(imported.secondStarDesign, 2), thirdStarDesign: normalizeStarDesign(imported.thirdStarDesign, 3), onboarded: true, taskLibrary: imported.taskTimeRecommendationsVersion === 2 ? imported.taskLibrary! : applyRecommendedTaskTimes(imported.taskLibrary!), taskTimeRecommendationsVersion: 2, history: imported.history ?? [], customCategories: imported.customCategories ?? [], deletedCategoryIds: imported.deletedCategoryIds ?? [], initiatives: imported.initiatives ?? [], markers: imported.markers ?? [], completed: imported.taskDay === today ? imported.completed ?? [] : [], taskDay: today });
          Alert.alert(tr(language, 'Импорт завершён'), tr(language, 'Настройки, список дел и история применены.'));
        } catch (error) { Alert.alert(tr(language, 'Не удалось импортировать'), error instanceof Error ? error.message : tr(language, 'Проверьте выбранный файл.')); }
      };
      if (files.length === 1) await applyFile(files[0]);
      else Alert.alert(tr(language, 'Выберите файл'), tr(language, 'Найдено несколько JSON-файлов.'), [...files.slice(0, 3).map((uri) => ({ text: decodeURIComponent(uri.split('/').pop() ?? 'JSON'), onPress: () => void applyFile(uri) })), { text: tr(language, 'Отмена'), style: 'cancel' }]);
    } catch (error) { Alert.alert(tr(language, 'Не удалось открыть папку'), error instanceof Error ? error.message : tr(language, 'Попробуйте ещё раз.')); }
  };  const confirmDelete = () => setConfirmingDelete(true);
  const historyByDay = Array.from(new Set((family.history ?? []).map((entry) => entry.date))).sort((a, b) => b.localeCompare(a)).map((date) => {
    const entries = family.history.filter((entry) => entry.date === date);
    const counts = Object.values(entries.reduce<Record<string, { taskId: string; title: string; icon: string; count: number; xp: number }>>((all, entry) => { const item = all[entry.taskId] ?? { taskId: entry.taskId, title: entry.title, icon: entry.icon, count: 0, xp: 0 }; item.count += 1; item.xp += entry.xp; all[entry.taskId] = item; return all; }, {}));
    return { date, entries, counts };
  });
  const sections = [
    { id: 'overview', label: tr(language, 'Обзор'), icon: '◫' },
    { id: 'tasks', label: tr(language, 'Дела и категории'), icon: '▦' },
    { id: 'stars', label: tr(language, 'Звёзды'), icon: '★' },
    { id: 'history', label: tr(language, 'История'), icon: '◷' },
    { id: 'data', label: tr(language, 'Данные'), icon: '⚙' },
  ] as const;
  const navigation = <View style={wide ? parentUi.sideNav : parentUi.mobileNav}>{sections.map(item => <Pressable key={item.id} onPress={() => setSection(item.id)} style={[wide ? parentUi.sideTab : parentUi.mobileTab, section === item.id && parentUi.activeTab]}><Text style={[parentUi.navText, section === item.id && parentUi.activeNavText]}>{item.icon}  {item.label}</Text></Pressable>)}</View>;
  return <View style={[parentUi.shell, wide && parentUi.wideShell]}>
    {wide && <View style={parentUi.sidebar}><Text style={parentUi.brand}>{tr(language, "✦  Мой опыт")}</Text><Text style={parentUi.brandSub}>{tr(language, "РОДИТЕЛЬСКАЯ ПАНЕЛЬ")}</Text>{navigation}<View style={{ flex: 1 }} /><Pressable onPress={onClose} style={parentUi.sideBack}><Text style={parentUi.sideBackText}>{tr(language, "← В детский режим")}</Text></Pressable></View>}
    <View style={parentUi.main}>
      <View style={parentUi.header}><View><Text style={parentUi.eyebrow}>{tr(language, "СЕМЕЙНЫЙ ПРОФИЛЬ ·")}{' '}{family.name || tr(language, 'Ребёнок')}</Text><Text style={parentUi.title}>{sections.find(item => item.id === section)?.label}</Text></View><View style={parentUi.headerXp}><Text style={parentUi.headerXpText}>⭐ {family.xp} XP</Text></View></View>
      {!wide && <><Pressable onPress={onClose}><Text style={parentUi.back}>{tr(language, "← В детский режим")}</Text></Pressable>{navigation}</>}
      <Animated.View key={section} entering={FadeInDown.duration(240)} exiting={FadeOut.duration(140)} style={{ gap: 12 }}>
      {section === 'overview' && <View style={parentUi.grid}>
        <View style={parentUi.statCard}><Text style={parentUi.statLabel}>{tr(language, "ДЕЛА СЕГОДНЯ")}</Text><Text style={parentUi.statValue}>{done} / {tasks.length}</Text><Text style={parentUi.statNote}>{tr(language, "завершено в детском плане")}</Text><View style={parentUi.statTrack}><View style={[parentUi.statFill, { width: `${tasks.length ? done / tasks.length * 100 : 0}%` }]} /></View></View>
        <View style={parentUi.statCard}><Text style={parentUi.statLabel}>{tr(language, "ВСЕГО ОПЫТА")}</Text><Text style={parentUi.statValue}>{family.xp} XP</Text><Text style={parentUi.statNote}>{tr(language, "до следующей звезды ·")}{' '}{xpToNextStar(family.xp)} XP</Text></View>
        <View style={parentUi.tip}><Text style={parentUi.tipTitle}>{tr(language, "💡 Подсказка для родителя")}</Text><Text style={parentUi.tipText}>{tr(language, "Спросите: «Что сегодня стало легче?» и «Где тебе нужна помощь?» Здесь нет оценок и сравнений.")}</Text></View>
        <Pressable onPress={() => setSection('tasks')} style={parentUi.quickLink}><Text style={parentUi.quickLinkText}>{tr(language, "Управлять делами →")}</Text></Pressable>
        <Pressable onPress={() => setSection('history')} style={parentUi.quickLink}><Text style={parentUi.quickLinkText}>{tr(language, "Открыть историю →")}</Text></Pressable>
      </View>}
      {section === 'tasks' && <View style={parentUi.stack}>
        <View style={parentUi.surface}><Text style={parentUi.heading}>{tr(language, "Дела в плане ·")}{' '}{family.taskLibrary.filter(task => task.enabled).length}</Text><Text style={parentUi.helper}>{tr(language, "Включённые дела появляются в детском режиме. Откройте карточку для редактирования.")}</Text><TextInput value={taskSearch} onChangeText={setTaskSearch} placeholder={tr(language, "Поиск по делам...")} style={styles.input} /><View style={styles.library}>{family.taskLibrary.filter(task => translatedTask(language, task.id, task.title, task.steps).title.toLocaleLowerCase().includes(taskSearch.trim().toLocaleLowerCase())).slice(0, showAllTasks || taskSearch ? undefined : 6).map(task => <TaskEditor key={task.id} task={task} categories={categories} editing={editing === task.id} onEdit={() => setEditing(task.id)} onCancel={() => setEditing(null)} onSave={patch => { updateTask(task.id, patch); setEditing(null); }} onDelete={() => { onChange({ ...family, taskLibrary: family.taskLibrary.filter(item => item.id !== task.id) }); setEditing(null); }} />)}</View>{family.taskLibrary.length > 6 && !taskSearch && <Pressable onPress={() => setShowAllTasks(!showAllTasks)} style={parentUi.secondaryButton}><Text style={parentUi.secondaryButtonText}>{showAllTasks ? tr(language, 'Свернуть список') : tr(language, 'Показать все дела · {{count}}', { count: family.taskLibrary.length })}</Text></Pressable>}</View>
        <View style={parentUi.surface}><Text style={parentUi.heading}>{tr(language, "Добавить своё дело")}</Text><Text style={parentUi.helper}>{tr(language, "Создайте дело с категорией, значком и временем.")}</Text><Pressable style={parentUi.primaryButton} onPress={onAddTask}><Text style={parentUi.primaryButtonText}>{tr(language, "＋ Добавить дело")}</Text></Pressable></View>
        <View style={parentUi.surface}><Text style={parentUi.heading}>{tr(language, "Каталог готовых дел")}</Text><Text style={parentUi.helper}>{tr(language, "Выберите категорию, затем добавьте дело в семейный план.")}</Text><View style={styles.categoryList}>{categories.map(category => { const templates = taskCategories.find(item => item.id === category.id)?.tasks ?? []; const manualTasks = family.taskLibrary.filter(item => item.categoryId === category.id && !catalogIds.has(item.id)); const categoryTitle = translatedCategory(family.language, category.id, category.title); return <View key={category.id} style={styles.categoryCard}><View style={styles.categoryHeader}><Pressable style={styles.categoryHeaderMain} onPress={() => setExpanded(expanded === category.id ? null : category.id)} accessibilityRole="button" accessibilityState={{ expanded: expanded === category.id }}><Text style={styles.categoryIcon}>{category.icon}</Text><Text style={styles.categoryTitle}>{categoryTitle}</Text><Text style={styles.categoryCount}>{taskCount(language, templates.length + manualTasks.length)}</Text></Pressable><Pressable style={styles.categoryTrashButton} onPress={() => setConfirmCategoryDelete(category.id)} accessibilityRole="button" accessibilityLabel={`${tr(family.language, 'tasks.deleteCategory') ?? 'Delete category'} ${categoryTitle}`}><TrashIcon /></Pressable><Pressable style={styles.categoryChevronButton} onPress={() => setExpanded(expanded === category.id ? null : category.id)} accessibilityRole="button" accessibilityState={{ expanded: expanded === category.id }} accessibilityLabel={expanded === category.id ? `${tr(family.language, 'tasks.collapse') ?? 'Collapse'} ${categoryTitle}` : `${tr(family.language, 'tasks.expand') ?? 'Expand'} ${categoryTitle}`}><DisclosureChevron expanded={expanded === category.id} /></Pressable></View><Collapsible expanded={expanded === category.id} contentStyle={styles.categoryTasks}>{templates.map(template => { const added = family.taskLibrary.find(item => item.id === template.id); const localized = { ...template, ...translatedTask(family.language, template.id, template.title, [...template.steps]) }; return <CatalogTaskRow key={template.id} language={family.language} template={localized} added={added} categories={categories} editing={catalogEditing === template.id} onToggle={() => toggleCatalogTask(template, category.id)} onEdit={() => editCatalogTask(template, category.id)} onCancel={() => setCatalogEditing(null)} onSave={patch => { updateTask(template.id, patch); setCatalogEditing(null); }} onDelete={() => { onChange({ ...family, taskLibrary: family.taskLibrary.filter(item => item.id !== template.id) }); setCatalogEditing(null); }} />; })}{manualTasks.map(item => { const template: TaskTemplate = { id: item.id, title: item.title, icon: item.icon, baseXp: item.xp, steps: item.steps, supervision: 'none', timeStart: item.timeStart, timeEnd: item.timeEnd }; return <CatalogTaskRow key={item.id} language={family.language} template={template} added={item} categories={categories} editing={catalogEditing === item.id} onToggle={() => updateTask(item.id, { enabled: !item.enabled })} onEdit={() => setCatalogEditing(item.id)} onCancel={() => setCatalogEditing(null)} onSave={patch => { updateTask(item.id, patch); setCatalogEditing(null); }} onDelete={() => { onChange({ ...family, taskLibrary: family.taskLibrary.filter(task => task.id !== item.id) }); setCatalogEditing(null); }} />; })}</Collapsible>{confirmCategoryDelete === category.id && <View style={styles.categoryDeleteConfirm}><Text style={styles.categoryDeletePrompt}>{tr(language, 'Удалить категорию «{{title}}» и все связанные дела?', { title: categoryTitle })}</Text><View style={styles.inline}><Pressable style={[styles.smallButton, styles.cancelDelete]} onPress={() => setConfirmCategoryDelete(null)}><Text style={styles.smallButtonText}>{tr(language, "Отмена")}</Text></Pressable><Pressable style={[styles.smallButton, styles.confirmDelete]} onPress={() => removeCategory(category.id)}><Text style={styles.smallButtonText}>{tr(language, "Удалить")}</Text></Pressable></View></View>}</View>; })}</View></View>
      </View>}
      {section === 'stars' && <View style={parentUi.stack}><View style={parentUi.surface}><DifficultyPicker value={family.difficulty} onChange={difficulty => onChange({ ...family, difficulty })} /></View><View style={parentUi.surface}><StarDesignPicker level={2} value={family.secondStarDesign} onChange={secondStarDesign => onChange({ ...family, secondStarDesign })} /></View><View style={parentUi.surface}><StarDesignPicker level={3} value={family.thirdStarDesign} onChange={thirdStarDesign => onChange({ ...family, thirdStarDesign })} /></View></View>}
      {section === 'history' && <View style={parentUi.stack}>{historyByDay.length === 0 ? <View style={parentUi.surface}><Text style={parentUi.helper}>{tr(language, "Пока записей нет. Выполненные дела появятся здесь.")}</Text></View> : historyByDay.map(day => <View key={day.date} style={parentUi.surface}><View style={parentUi.historyHeading}><Text style={parentUi.heading}>{day.date}</Text><Text style={parentUi.historyXp}>{day.entries.reduce((sum, entry) => sum + entry.xp, 0)} XP</Text></View><Text style={parentUi.helper}>{day.entries.length} {' '}{tr(language, "отметок")}</Text>{day.counts.map(item => <View key={item.title} style={parentUi.historyRow}><Text style={parentUi.historyItem}>{item.icon}  {translatedTask(language, item.taskId, item.title, []).title}</Text><Text style={parentUi.historyXp}>{item.count} × · {item.xp} XP</Text></View>)}</View>)}</View>}
      {section === 'data' && <View style={parentUi.stack}><View style={parentUi.surface}><Text style={parentUi.heading}>{tr(language, "Данные семьи")}</Text><Text style={parentUi.helper}>{tr(language, "Сохраните резервную копию или загрузите данные из JSON.")}</Text><Pressable style={parentUi.secondaryButton} onPress={() => void exportData()}><Text style={parentUi.secondaryButtonText}>{tr(language, "Экспортировать JSON")}</Text></Pressable><Pressable style={parentUi.secondaryButton} onPress={() => void importData()}><Text style={parentUi.secondaryButtonText}>{tr(language, "Импортировать JSON")}</Text></Pressable></View><View style={parentUi.surface}><Text style={parentUi.heading}>{tr(language, "Удаление данных")}</Text><Text style={parentUi.helper}>{tr(language, "Удаляются профиль, опыт, история и дела.")}</Text><Pressable style={parentUi.deleteButton} onPress={confirmDelete}><Text style={parentUi.deleteText}>{tr(language, "Удалить все данные")}</Text></Pressable>{confirmingDelete && <View style={styles.deleteConfirm}><Text style={parentUi.heading}>{tr(language, "Удалить семейные данные?")}</Text><Text style={parentUi.helper}>{tr(language, "Это действие нельзя отменить.")}</Text><View style={styles.inline}><Pressable style={[styles.smallButton, styles.cancelDelete]} onPress={() => setConfirmingDelete(false)}><Text style={styles.smallButtonText}>{tr(language, "Отмена")}</Text></Pressable><Pressable style={[styles.smallButton, styles.confirmDelete]} onPress={() => void onDelete()}><Text style={styles.smallButtonText}>{tr(language, "Удалить")}</Text></Pressable></View></View>}</View></View>}
      </Animated.View>
    </View>
  </View>;
}function CatalogTaskRow({ template, added, categories, language, editing, onToggle, onEdit, onCancel, onSave, onDelete }: { template: TaskTemplate; added?: StoredTask; categories: StoredCategory[]; language: Language; editing: boolean; onToggle: () => void; onEdit: () => void; onCancel: () => void; onSave: (patch: Partial<StoredTask>) => void; onDelete: () => void }) {
  if (editing && added) return <TaskEditor task={added} categories={categories} editing onEdit={onEdit} onCancel={onCancel} onSave={onSave} onDelete={onDelete} />;
  return <View style={[styles.templateButton, styles.categoryTask]}><Text style={styles.libraryIcon}>{template.icon}</Text><View style={styles.cardBody}><Text style={styles.templateText}>{template.title}</Text><Text style={styles.libraryMeta}>{added?.xp ?? template.baseXp} XP · {template.steps.length} {tr(language, template.steps.length === 1 ? 'tasks.step' : 'tasks.steps')}</Text></View><Pressable style={styles.catalogCheckboxButton} onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked: !!added?.enabled }} accessibilityLabel={tr(language, added?.enabled ? 'catalog.remove' : 'catalog.add', { title: template.title })}><View style={[styles.catalogCheckbox, added?.enabled && styles.catalogCheckboxChecked]}>{added?.enabled && <Text style={styles.catalogCheckboxMark}>✓</Text>}</View></Pressable><Pressable style={styles.catalogEditButton} onPress={onEdit} accessibilityRole="button" accessibilityLabel={tr(language, 'catalog.edit', { title: template.title })}><Text style={styles.catalogEditIcon}>✎</Text></Pressable></View>;
}
function TrashIcon() {
  return <View style={styles.trashIconFrame}><View style={styles.trashIconHandle} /><View style={styles.trashIconLid} /><View style={styles.trashIconBody}><View style={styles.trashIconLine} /><View style={styles.trashIconLine} /></View></View>;
}
function IconPicker({ selected, onSelect, label }: { selected: string; onSelect: (icon: string) => void; label?: string }) {
  const language = useUiLanguage();
  const [open, setOpen] = useState(false);
  return <View style={styles.iconPicker}><Pressable style={styles.iconPickerButton} onPress={() => setOpen((value) => !value)} accessibilityRole="button" accessibilityState={{ expanded: open }}><Text style={styles.iconPickerSelected}>{selected}</Text><Text style={styles.actionText}>{open ? tr(language, 'Скрыть значки') : label ?? tr(language, 'Выбрать значок')}</Text><DisclosureChevron expanded={open} /></Pressable>{open && <Animated.ScrollView entering={FadeInDown.duration(200)} exiting={FadeOut.duration(120)} style={styles.iconGridScroll} nestedScrollEnabled keyboardShouldPersistTaps="always"><View style={styles.iconGrid}>{taskIcons.map((icon, index) => <Pressable key={`${icon}-${index}`} onPress={() => { onSelect(icon); setOpen(false); }} style={[styles.iconOption, selected === icon && styles.iconOptionSelected]} accessibilityRole="button" accessibilityLabel={tr(language, 'Выбрать значок {{icon}}', { icon })}><Text style={styles.iconOptionText}>{icon}</Text></Pressable>)}</View></Animated.ScrollView>}</View>;
}
function CategoryPicker({ categories, selected, onSelect }: { categories: StoredCategory[]; selected: string; onSelect: (id: string) => void }) {
  const language = useUiLanguage();
  const [open, setOpen] = useState(false);
  const current = categories.find((category) => category.id === selected);
  return <View style={styles.iconPicker}><Pressable style={styles.iconPickerButton} onPress={() => setOpen((value) => !value)} accessibilityRole="button" accessibilityState={{ expanded: open }}><Text style={styles.categoryIcon}>{current?.icon ?? '📁'}</Text><Text style={styles.cardBody}>{current ? translatedCategory(language, current.id, current.title) : tr(language, 'Выберите категорию')}</Text><DisclosureChevron expanded={open} /></Pressable>{open && <Animated.ScrollView entering={FadeInDown.duration(200)} exiting={FadeOut.duration(120)} style={styles.categoryPickerList} nestedScrollEnabled keyboardShouldPersistTaps="always">{categories.map((category) => <Pressable key={category.id} style={styles.categoryPickerOption} onPress={() => { onSelect(category.id); setOpen(false); }}><Text style={styles.categoryIcon}>{category.icon}</Text><Text style={styles.templateText}>{translatedCategory(language, category.id, category.title)}</Text></Pressable>)}</Animated.ScrollView>}</View>;
}
function TaskEditor({ task, categories, editing, onEdit, onCancel, onSave, onDelete }: { task: StoredTask; categories: StoredCategory[]; editing: boolean; onEdit: () => void; onCancel: () => void; onSave: (patch: Partial<StoredTask>) => void; onDelete: () => void }) {
  const language = useUiLanguage();
  const [title, setTitle] = useState(translatedTask(language, task.id, task.title, task.steps).title); const [xp, setXp] = useState(String(task.xp)); const [icon, setIcon] = useState(task.icon); const [categoryId, setCategoryId] = useState(task.categoryId ?? categories[0]?.id ?? 'home'); const [timeStart, setTimeStart] = useState(task.timeStart ?? ''); const [timeEnd, setTimeEnd] = useState(task.timeEnd ?? ''); const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => { if (editing) { setTitle(translatedTask(language, task.id, task.title, task.steps).title); setXp(String(task.xp)); setIcon(task.icon); setCategoryId(task.categoryId ?? categories[0]?.id ?? 'home'); setTimeStart(task.timeStart ?? ''); setTimeEnd(task.timeEnd ?? ''); } }, [editing, task, categories, language]);
  if (editing) return <View style={styles.editCard}><TextInput value={title} onChangeText={setTitle} style={styles.input} /><CategoryPicker categories={categories} selected={categoryId} onSelect={setCategoryId} /><IconPicker selected={icon} onSelect={setIcon} /><Text style={styles.libraryMeta}>{tr(language, "Время доступности · необязательно")}</Text><View style={styles.inline}><TextInput value={timeStart} onChangeText={(value) => setTimeStart(value.slice(0, 5))} placeholder={tr(language, "С 08:00")} maxLength={5} style={[styles.input, styles.flexInput]} /><TextInput value={timeEnd} onChangeText={(value) => setTimeEnd(value.slice(0, 5))} placeholder={tr(language, "До 20:00")} maxLength={5} style={[styles.input, styles.flexInput]} /></View><View style={styles.inline}><TextInput value={xp} onChangeText={setXp} keyboardType="number-pad" style={[styles.input, styles.flexInput]} /><Pressable style={styles.smallButton} onPress={() => onSave({ title: title.trim() || task.title, icon: icon.trim() || '⭐', xp: normalizeTaskXp(xp), categoryId, timeStart: /^([01]\d|2[0-3]):[0-5]\d$/.test(timeStart) ? timeStart : undefined, timeEnd: /^([01]\d|2[0-3]):[0-5]\d$/.test(timeEnd) ? timeEnd : undefined })}><Text style={styles.smallButtonText}>{tr(language, "Готово")}</Text></Pressable></View>{confirmDelete ? <View style={styles.deleteConfirm}><Text style={styles.libraryTitle}>{tr(language, 'Удалить дело «{{title}}»?', { title: translatedTask(language, task.id, task.title, task.steps).title })}</Text><View style={styles.inline}><Pressable style={[styles.smallButton, styles.cancelDelete]} onPress={() => setConfirmDelete(false)}><Text style={styles.smallButtonText}>{tr(language, "Отмена")}</Text></Pressable><Pressable style={[styles.smallButton, styles.confirmDelete]} onPress={onDelete}><Text style={styles.smallButtonText}>{tr(language, "Удалить")}</Text></Pressable></View></View> : <Pressable style={styles.deleteButton} onPress={() => setConfirmDelete(true)}><Text style={styles.deleteText}>{tr(language, "Удалить дело")}</Text></Pressable>}<Pressable onPress={onCancel}><Text style={styles.cancelText}>{tr(language, "Отмена")}</Text></Pressable></View>;
  const category = categories.find((item) => item.id === task.categoryId);
  return <View style={[styles.libraryItem, !task.enabled && styles.libraryItemDisabled]}><Text style={styles.libraryIcon}>{task.icon}</Text><View style={styles.cardBody}><Text style={styles.libraryTitle}>{translatedTask(language, task.id, task.title, task.steps).title}</Text><Text style={styles.libraryMeta}>{task.xp} {' '}{tr(language, "опыта ·")}{' '}{category ? translatedCategory(language, category.id, category.title) : tr(language, 'Без категории')} · {tr(language, task.enabled ? 'видно ребёнку' : 'скрыто')}{task.timeStart || task.timeEnd ? ` · ${task.timeStart ?? '00:00'}–${task.timeEnd ?? '23:59'}` : ''}</Text></View><Pressable onPress={() => onSave({ enabled: !task.enabled })}><Text style={styles.actionText}>{tr(language, task.enabled ? 'Скрыть' : 'Включить')}</Text></Pressable><Pressable onPress={onEdit}><Text style={styles.actionText}>{tr(language, "Изменить")}</Text></Pressable></View>;
}




















