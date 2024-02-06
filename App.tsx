import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import { View, Text, TouchableOpacity } from 'react-native';
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
  const [log, setLog] = useState('');
  const appendLog = useCallback(
    (log: string) => setLog((old) => (old += log)),
    [setLog]
  );

  const [clicks, setClicks] = useState([0, 0]);

  const incrementClicks = useCallback(
    (index: number) =>
      setClicks((old) => old.map((v, i) => (i === index ? v + 1 : v))),
    [setClicks]
  );

  const animatedOpacity = useSharedValue([1, 1]);

  const currentRectangleGestured = useSharedValue<number | null>(null);
  const currentTouchId = useSharedValue<number | null>(null);

  const gesture = useMemo(() => {
    /** Just for debugging. */
    function debugLog(text: string) {
      'worklet';
      runOnJS(appendLog)(text + '\n');
    }

    ////
    // The following three functions should really be given as callbacks to the gesture, e.g. with
    // Gesture.Manual().onStart((_, success) => { code goes here }).
    //
    // However, this doesn't seem to work on native, so we have to put them in the onTouchesX callbacks.
    // See https://github.com/software-mansion/react-native-gesture-handler/issues/2228 for information.
    ///
    function onStart() {
      'worklet';
      debugLog('onStart');
      // Use 'withTiming' for a smoother animation - rather than just instantly changing.
      animatedOpacity.value = withTiming(
        animatedOpacity.value.map((o, i) =>
          i === currentRectangleGestured.value ? 0.4 : o
        ),
        {
          duration: 100,
          easing: Easing.linear,
        }
      );
    }

    function onSuccess() {
      'worklet';
      debugLog('onSuccess');
      runOnJS(incrementClicks)(currentRectangleGestured.value!);
    }

    function onFinalize() {
      'worklet';
      debugLog('onFinalize');
      // Use 'withTiming' for a smoother animation - rather than just instantly changing.
      animatedOpacity.value = withTiming(
        animatedOpacity.value.map((o, i) =>
          i === currentRectangleGestured.value ? 1 : o
        ),
        {
          duration: 100,
          easing: Easing.linear,
        }
      );
      currentTouchId.value = null;
      currentRectangleGestured.value = null;
    }

    return Gesture.Manual()
      .onTouchesDown((e, manager) => {
        const newTouch = e.changedTouches[0];
        if (newTouch === undefined) {
          return;
        }

        debugLog(`onTouchesDown ${newTouch.id}`);
        const inRectangle = isInRectangle(newTouch.x, newTouch.y);
        if (inRectangle === null) {
          return;
        }

        // We only have eyes for this touch.
        currentTouchId.value = newTouch.id;
        currentRectangleGestured.value = inRectangle; // 'red' or 'green'

        // Start the gesture!
        onStart();
        manager.begin();
        manager.activate();
      })
      .onTouchesUp((e, manager) => {
        const removedTouch = e.changedTouches.find(
          (it) => it.id === currentTouchId.value
        );
        if (removedTouch === undefined) {
          // Only touches we're not tracking were lifted - ignore.
          return;
        }

        debugLog(`onTouchesUp ${removedTouch.id}`);
        // Our touch was lifted. End or fail the gesture!
        // Check that the touch is still in the original rectangle.
        const inRectangle = isInRectangle(removedTouch.x, removedTouch.y);

        if (inRectangle === currentRectangleGestured.value) {
          // End the gesture!

          onSuccess();
          onFinalize();
          manager.end();
        } else {
          // Gesture failed!
          onFinalize();
          manager.fail();
        }
      })
      .onTouchesCancelled((e, manager) => {
        const cancelledTouch = e.changedTouches.find(
          (it) => it.id === currentTouchId.value
        );
        if (cancelledTouch === undefined) {
          // Only touches we're not tracking were cancelled - ignore.
          return;
        }

        debugLog(`onTouchesCanceled ${cancelledTouch.id}`);
        // Our touch was cancelled. Fail the gesture!
        onFinalize();
        manager.fail();
      });
  }, [
    animatedOpacity,
    currentRectangleGestured,
    currentTouchId,
    incrementClicks,
    appendLog,
  ]);

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
      <TouchableOpacity onPress={() => setLog('')}>
      <Text style={{backgroundColor: '#0ff1'}}>
        {'Log (click to clear):\n'}
        {log}
      </Text>
      </TouchableOpacity>
    </GestureHandlerRootView>
  );
}

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
