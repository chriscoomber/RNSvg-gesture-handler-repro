import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import { View, Text } from 'react-native';
import { Svg, Path, Circle, Rect } from 'react-native-svg';
import { useState, useCallback, useMemo } from 'react';
import Animated, {
  useSharedValue,
  runOnJS,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

function isInRectangle(x: number, y: number): 'red' | 'green' | null {
  'worklet';
  if (x >= 50 && y >= 50 && x <= 150 && y <= 150) {
    return 'green';
  } else if (x >= 0 && y >= 0 && x <= 100 && y <= 100) {
    return 'red';
  } else {
    return null;
  }
}

export default function App() {
  
  const [redClicks, setRedClicks] = useState(0);
  const [greenClicks, setGreenClicks] = useState(0);

  const incrementRedClicks = useCallback(
    () => setRedClicks((old) => old + 1),
    [setRedClicks]
  );
  const incrementGreenClicks = useCallback(
    () => setGreenClicks((old) => old + 1),
    [setGreenClicks]
  );

  const animatedRedOpacity = useSharedValue(1);
  const animatedGreenOpacity = useSharedValue(1);

  const currentRectangleGestured = useSharedValue<'red' | 'green' | null>(null);
  const currentTouchId = useSharedValue<number | null>(null);

  const gesture = useMemo(
    () =>
      Gesture.Manual()
        .onTouchesDown((e, manager) => {
          const newTouch = e.changedTouches[0];
          if (newTouch === undefined) {
            return;
          }

          const inRectangle = isInRectangle(newTouch.x, newTouch.y);
          if (inRectangle === null) {
            return;
          }

          // We only have eyes for this touch.
          currentTouchId.value = newTouch.id;
          currentRectangleGestured.value = inRectangle; // 'red' or 'green'

          // Start the gesture!
          manager.begin();
          manager.activate();
        })
        .onTouchesUp((e, manager) => {
          const removedTouch = e.changedTouches.find(
            (it) => it.id === currentTouchId.value
          );
          if (removedTouch === undefined) {
            return;
          }

          // Check that the touch is still in the original rectangle.
          const inRectangle = isInRectangle(removedTouch.x, removedTouch.y);

          if (inRectangle === currentRectangleGestured.value) {
            // End the gesture!
            manager.end();
          } else {
            // Gesture failed!
            manager.fail();
          }
        })
        .onTouchesCancelled((e, manager) => {
          const cancelledTouch = e.changedTouches.find(it => it.id === currentTouchId.value);
          if (cancelledTouch === undefined) {
            return;
          }
          manager.fail();
          
        })
        .onStart(() => {
          if (currentRectangleGestured.value === 'green') {
            animatedGreenOpacity.value = 0.4;
          } else if (currentRectangleGestured.value === 'red') {
            animatedRedOpacity.value = 0.4;
          }
        })
        .onEnd((_, success) => {
          if (!success) {
            return;
          }
          if (currentRectangleGestured.value === 'green') {
            runOnJS(incrementGreenClicks)();
          } else if (currentRectangleGestured.value === 'red') {
            runOnJS(incrementRedClicks)();
          }
        })
        .onFinalize(() => {
          if (currentRectangleGestured.value === 'green') {
            animatedGreenOpacity.value = 1;
          } else if (currentRectangleGestured.value === 'red') {
            animatedRedOpacity.value = 1;
          }
          currentTouchId.value = null;
          currentRectangleGestured.value = null;
        }),
    [
      animatedGreenOpacity,
      animatedRedOpacity,
      currentRectangleGestured,
      currentTouchId,
      incrementGreenClicks,
      incrementRedClicks,
    ]
  );

  const greenOpacityProps = useAnimatedProps(
    () => ({
      opacity: withTiming(animatedGreenOpacity.value, {
        duration: 200,
        easing: Easing.linear,
      }),
    }),
    [animatedGreenOpacity]
  );

  const redOpacityProps = useAnimatedProps(
    () => ({
      opacity: withTiming(animatedRedOpacity.value, {
        duration: 200,
        easing: Easing.linear,
      }),
    }),
    [animatedRedOpacity]
  );

  return (
    <GestureHandlerRootView style={{ flex: 1, paddingTop: 200 }}>
      <Text>Click me!</Text>
      <View style={{ padding: 10, borderWidth: 1, alignSelf: 'flex-start' }}>
        <GestureDetector gesture={gesture}>
          <AnimatedSvg width={200} height={200}>
            <AnimatedRect
              width={100}
              height={100}
              fill={'red'}
              animatedProps={redOpacityProps}
            />
            <AnimatedRect
              width={100}
              height={100}
              x={50}
              y={50}
              fill={'green'}
              animatedProps={greenOpacityProps}
            />
          </AnimatedSvg>
        </GestureDetector>
      </View>
      <Text>
        Click count {redClicks} | {greenClicks}
      </Text>
    </GestureHandlerRootView>
  );
}
