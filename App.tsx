import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import { View, Text } from 'react-native';
import { Svg, Rect } from 'react-native-svg';
import { useState, useCallback, useMemo } from 'react';
import Animated, {
  useSharedValue,
  runOnJS,
  useAnimatedProps,
  withTiming,
  Easing,
  SharedValue,
} from 'react-native-reanimated';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

/** Our function to calculate which region is being clicked. Simple for us as we just have two rectangles. */
function isInRectangle(x: number, y: number): number | null {
  'worklet';
  if (x >= 50 && y >= 50 && x <= 150 && y <= 150) {
    return 1;
  } else if (x >= 0 && y >= 0 && x <= 100 && y <= 100) {
    return 0;
  } else {
    return null;
  }
}

export default function App() {
  const [clicks, setClicks] = useState([0, 0]);

  /** The callback we want to call when a rectangle is clicked. In our case, we just keep a tally of clicks. */
  const incrementClicks = useCallback(
    (index: number) =>
      setClicks((old) => old.map((v, i) => (i === index ? v + 1 : v))),
    [setClicks]
  );

  /** The opacities of each rectangle. Just used to make the gesture feel a bit more responsive. */
  const animatedOpacity = useSharedValue([1, 1]);

  /** Index of the rectangle the gesture is acting upon. 0 or 1 (or null when there's no gesture). */
  const currentRectangleGestured = useSharedValue<number | null>(null);

  /** The gesture. We just use a Tap gesture. */
  const gesture = useMemo(
    () =>
      Gesture.Tap()
        .onBegin((e) => {
          currentRectangleGestured.value = isInRectangle(e.x, e.y);

          animatedOpacity.value = withTiming(
            animatedOpacity.value.map((o, i) =>
              i === currentRectangleGestured.value ? 0.4 : o
            ),
            {
              duration: 100,
              easing: Easing.linear,
            }
          );
        })
        .onEnd((_, success) => {
          if (success) {
            runOnJS(incrementClicks)(currentRectangleGestured.value!);
          }
        })
        .onFinalize(() => {
          animatedOpacity.value = withTiming(
            animatedOpacity.value.map((o, i) =>
              i === currentRectangleGestured.value ? 1 : o
            ),
            {
              duration: 100,
              easing: Easing.linear,
            }
          );
          currentRectangleGestured.value = null;
        }),
    [animatedOpacity, currentRectangleGestured, incrementClicks]
  );

  return (
    <GestureHandlerRootView style={{ flex: 1, paddingTop: 200 }}>
      <Text>Click me!</Text>
      <View style={{ padding: 10, borderWidth: 1, alignSelf: 'flex-start' }}>
        <GestureDetector gesture={gesture}>
          <AnimatedSvg width={200} height={200}>
            <ClickableSvgComponent
              index={0}
              x={0}
              y={0}
              color="red"
              animatedOpacity={animatedOpacity}
            />
            <ClickableSvgComponent
              index={1}
              x={50}
              y={50}
              color="green"
              animatedOpacity={animatedOpacity}
            />
          </AnimatedSvg>
        </GestureDetector>
      </View>
      <Text>
        Click count {clicks[0]} | {clicks[1]}
      </Text>
    </GestureHandlerRootView>
  );
}

/**
 * Each clickable rectangle needs to be its own react component
 * so that we can use the `useAnimatedProps` hook to sort out the opacity.
 */
function ClickableSvgComponent({
  index,
  x,
  y,
  color,
  animatedOpacity,
}: {
  index: number;
  x: number;
  y: number;
  animatedOpacity: SharedValue<number[]>;
  color: string;
}) {
  const opacityProps = useAnimatedProps(
    () => ({
      opacity: animatedOpacity.value[index],
    }),
    [animatedOpacity]
  );

  return (
    <AnimatedRect
      width={100}
      height={100}
      fill={color}
      animatedProps={opacityProps}
      x={x}
      y={y}
    />
  );
}
