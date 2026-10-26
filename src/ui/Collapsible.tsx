import { useEffect, useState, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export function Collapsible({ expanded, children, contentStyle }: { expanded: boolean; children: ReactNode; contentStyle?: StyleProp<ViewStyle> }) {
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const height = useSharedValue(0);

  useEffect(() => {
    height.value = withTiming(expanded ? measuredHeight : 0, { duration: 240 });
  }, [expanded, measuredHeight, height]);

  const animatedStyle = useAnimatedStyle(() => ({ height: height.value }));

  return <Animated.View style={[{ overflow: 'hidden', pointerEvents: expanded ? 'auto' : 'none' }, animatedStyle]}>
    <View style={[{ position: 'absolute', top: 0, left: 0, right: 0 }, contentStyle]} onLayout={event => {
      const nextHeight = Math.ceil(event.nativeEvent.layout.height);
      if (nextHeight > 0) setMeasuredHeight(nextHeight);
    }}>{children}</View>
  </Animated.View>;
}
