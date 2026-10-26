import { useEffect, useId } from 'react';
import { Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, interpolate, useAnimatedProps, useSharedValue, withDelay, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';
import { getStarDesign, type StarDesign, type StarMotion } from '@/src/domain/star-designs';
import { tr, type Language } from '@/src/content/i18n';
import { styles } from './styles';

const starPoints = '18,1 22.5,12.5 35,13.5 25.5,21.5 28.5,34 18,27 7.5,34 10.5,21.5 1,13.5 13.5,12.5';
const glitterDots = Array.from({ length: 64 }, (_, i) => ({
  x: 3 + (i % 8) * 4.4 + ((i * 7) % 3) * 0.5,
  y: 3 + Math.floor(i / 8) * 4.3 + ((i * 11) % 3) * 0.5,
  radius: i % 5 === 0 ? 0.95 : 0.55,
}));
const gemDots = [[11, 12], [22, 9], [27, 16], [18, 17], [10, 22], [24, 25], [18, 29], [17, 6]];
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

function MovingSparkle({ progress, x, offset, motion, color }: { progress: SharedValue<number>; x: number; offset: number; motion: StarMotion; color: string }) {
  const animatedProps = useAnimatedProps(() => {
    const phase = (progress.value + offset) % 1;
    if (motion === 'orbit') return { cx: 18 + 12 * Math.cos(phase * Math.PI * 2), cy: 18 + 12 * Math.sin(phase * Math.PI * 2), opacity: 0.4 + 0.6 * Math.sin(phase * Math.PI) };
    if (motion === 'twinkle') return { cx: x, cy: 8 + (x * 7) % 22, opacity: interpolate(phase, [0, 0.35, 0.55, 0.8, 1], [0, 0.4, 1, 0.25, 0]) };
    return { cx: x, cy: interpolate(phase, [0, 1], [-3, 39]), opacity: interpolate(phase, [0, 0.15, 0.55, 0.85, 1], [0, 0.4, 1, 0.65, 0]) };
  });
  return <AnimatedCircle r={1.3} fill={color} animatedProps={animatedProps} />;
}

function PassingGlint({ progress, color }: { progress: SharedValue<number>; color: string }) {
  const animatedProps = useAnimatedProps(() => ({ x: interpolate(progress.value, [0, 1], [-15, 48]) }));
  return <AnimatedRect y={-5} width={7} height={48} fill={color} opacity={0.36} transform="rotate(22 18 18)" animatedProps={animatedProps} />;
}

function StarTexture({ design, preview, premium }: { design: StarDesign; preview: boolean; premium: boolean }) {
  if (design.texture === 'facets') return <>
    <Polygon points="18,2 25,13 18,18" fill={design.sparkle} opacity={0.32} />
    <Polygon points="18,2 11,13 18,18" fill={design.glitter} opacity={0.36} />
    <Polygon points="11,13 18,18 12,28" fill={design.sparkle} opacity={0.18} />
    <Polygon points="25,13 18,18 24,28" fill={design.glitter} opacity={0.24} />
    <Path d="M18 2 L18 34 M8 14 L28 14 M11 28 L25 28" stroke={design.sparkle} strokeWidth={preview ? 0.55 : 0.8} opacity={0.7} />
    {glitterDots.filter((_, index) => index % (preview ? 11 : 6) === 0).map((dot, index) => <Circle key={index} cx={dot.x} cy={dot.y} r={dot.radius * 0.8} fill={design.sparkle} />)}
  </>;
  if (design.texture === 'rays') return <>
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
      const radians = angle * Math.PI / 180;
      return <Line key={angle} x1={18 + Math.cos(radians) * 4} y1={18 + Math.sin(radians) * 4} x2={18 + Math.cos(radians) * 17} y2={18 + Math.sin(radians) * 17} stroke={design.sparkle} strokeWidth={preview ? 0.55 : 0.8} opacity={0.65} />;
    })}
    {glitterDots.filter((_, index) => index % (preview ? 8 : 4) === 0).map((dot, index) => <Circle key={index} cx={dot.x} cy={dot.y} r={dot.radius} fill={design.glitter} />)}
  </>;
  if (design.texture === 'gems') return <>
    {gemDots.slice(0, preview ? 5 : 8).map(([x, y], index) => <Polygon key={index} points={`${x},${y - 2} ${x + 1.6},${y} ${x},${y + 2} ${x - 1.6},${y}`} fill={index % 2 ? design.sparkle : design.glitter} opacity={0.9} />)}
    {glitterDots.filter((_, index) => index % (preview ? 9 : 5) === 0).map((dot, index) => <Circle key={index} cx={dot.x} cy={dot.y} r={0.5} fill={design.sparkle} />)}
  </>;
  return <>{glitterDots.filter((_, index) => !preview || index % 3 === 0).map((dot, index) => <Circle key={index} cx={dot.x} cy={dot.y} r={premium ? dot.radius * 1.25 : dot.radius} fill={index % 3 === 0 ? design.highlight ?? design.sparkle : design.glitter} />)}</>;
}

function StarMotifBack({ design }: { design: StarDesign }) {
  if (design.motif === 'medal') return <>
    <Path d="M13 22 L12 35 L18 31 L24 35 L23 22 Z" fill={design.outline} />
    <Circle cx={18} cy={18} r={17} fill="none" stroke={design.outline} strokeWidth={1.1} />
    <Circle cx={18} cy={18} r={15.2} fill="none" stroke={design.glitter} strokeWidth={0.7} />
  </>;
  if (design.motif === 'burst') return <>
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
      const radians = angle * Math.PI / 180;
      return <Line key={angle} x1={18 + Math.cos(radians) * 14} y1={18 + Math.sin(radians) * 14} x2={18 + Math.cos(radians) * 17.5} y2={18 + Math.sin(radians) * 17.5} stroke={design.sparkle} strokeWidth={1} strokeLinecap="round" />;
    })}
  </>;
  if (design.motif === 'orbit') return <Ellipse cx={18} cy={18} rx={16.8} ry={6.5} transform="rotate(-32 18 18)" fill="none" stroke={design.glitter} strokeWidth={0.8} opacity={0.9} />;
  return null;
}

function StarMotifFront({ design }: { design: StarDesign }) {
  if (design.motif === 'smile') return <>
    <Circle cx={14} cy={15.5} r={1.15} fill="#5B351F" />
    <Circle cx={22} cy={15.5} r={1.15} fill="#5B351F" />
    <Circle cx={13.1} cy={19} r={1.4} fill="#F27686" opacity={0.65} />
    <Circle cx={22.9} cy={19} r={1.4} fill="#F27686" opacity={0.65} />
    <Path d="M15 19 Q18 22.5 21 19" fill="none" stroke="#5B351F" strokeWidth={1.25} strokeLinecap="round" />
  </>;
  if (design.motif === 'crown') return <>
    <Polygon points="11,10 12,5 16,8 18,3.5 20,8 24,5 25,10" fill={design.jewel} stroke={design.outline} strokeWidth={0.65} strokeLinejoin="round" />
    {[13, 18, 23].map((cx) => <Circle key={cx} cx={cx} cy={8} r={0.65} fill={design.outline} />)}
  </>;
  return null;
}

export function StarIcon({ index, filled, stage, muted, secondDesign, thirdDesign, preview = false, language = 'ru' }: { index: number; filled: boolean; stage: 0 | 1 | 2 | 3; muted: string; secondDesign: string; thirdDesign: string; preview?: boolean; language?: Language }) {
  const id = useId().replace(/:/g, '');
  const premium = stage === 3;
  const decorated = stage >= 2;
  const design = getStarDesign(premium ? thirdDesign : secondDesign, premium ? 3 : 2);
  const progress = useSharedValue(0);
  useEffect(() => {
    if (!decorated || preview) return;
    progress.value = withDelay(index * 420, withRepeat(withTiming(1, { duration: premium ? 1900 : 2500, easing: Easing.linear }), -1));
    return () => { cancelAnimation(progress); progress.value = 0; };
  }, [decorated, index, premium, preview, progress]);

  return <View style={styles.starSlot} accessibilityLabel={tr(language, 'star.accessibility', { state: tr(language, filled ? 'star.received' : 'star.notReceived'), number: index + 1, kind: tr(language, premium ? 'star.premium' : decorated ? 'star.shining' : 'star.ordinary') })}>
    {decorated ? <Svg width={premium ? 44 : 40} height={premium ? 44 : 40} viewBox="0 0 36 36">
      <Defs>
        <ClipPath id={`clip-${id}`}><Polygon points={starPoints} /></ClipPath>
        <LinearGradient id={`gradient-${id}`} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={design.colors[0]} /><Stop offset="0.38" stopColor={design.colors[1]} /><Stop offset="0.75" stopColor={design.deep ?? design.colors[2]} /><Stop offset="1" stopColor={design.colors[2]} /></LinearGradient>
      </Defs>
      <StarMotifBack design={design} />
      <Polygon points={starPoints} fill={`url(#gradient-${id})`} stroke={design.outline} strokeWidth={premium ? 1.2 : 0.7} />
      <G clipPath={`url(#clip-${id})`}>
        {!preview && (premium || design.motion === 'sweep') && <PassingGlint progress={progress} color={design.glint ?? design.sparkle} />}
        <StarTexture design={design} preview={preview} premium={premium} />
        {!preview && [5, 11, 17, 23, 29, 33].map((x, sparkleIndex) => <MovingSparkle key={x} progress={progress} x={x} offset={sparkleIndex / 6} motion={design.motion} color={design.sparkle} />)}
        {premium && <Polygon points="18,13 22,18 18,23 14,18" fill={design.jewel} opacity={0.85} />}
      </G>
      <StarMotifFront design={design} />
    </Svg> : <Text style={[styles.dailyStarGlyph, { color: filled ? '#F2B632' : muted }]}>{filled ? '★' : '☆'}</Text>}
  </View>;
}
