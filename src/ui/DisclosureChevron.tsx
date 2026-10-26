import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export function DisclosureChevron({ expanded, color = '#9DB6A7' }: { expanded: boolean; color?: string }) {
  const rotation = useSharedValue(expanded ? 90 : 0);
  useEffect(() => {
    rotation.value = withTiming(expanded ? 90 : 0, { duration: 180 });
  }, [expanded, rotation]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  return <Animated.View style={[styles.container, animatedStyle]}>
    <View style={[styles.stroke, styles.upperStroke, { backgroundColor: color }]} />
    <View style={[styles.stroke, styles.lowerStroke, { backgroundColor: color }]} />
  </Animated.View>;
}

const styles = StyleSheet.create({
  container: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  stroke: { position: 'absolute', left: 9, width: 6, height: 1.5, borderRadius: 1 },
  upperStroke: { top: 8.5, transform: [{ rotate: '45deg' }] },
  lowerStroke: { top: 12.5, transform: [{ rotate: '-45deg' }] },
});
