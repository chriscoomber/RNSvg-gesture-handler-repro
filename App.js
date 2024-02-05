import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import { View, Text } from 'react-native';
import { Svg, Path, Circle } from 'react-native-svg';
import { useState, useCallback } from 'react';

export default function App() {
  const path = 'M 0 0 L 0 100 L 100 100 L 100 0 Z';

  const [squareFill, setSquareFill] = useState('red');
  const switchSquareColor = useCallback(
    () => setSquareFill((old) => (old === 'red' ? 'green' : 'red')),
    [setSquareFill]
  );

  const [circleFill, setCircleFill] = useState('blue');
  const switchCircleColor = useCallback(
    () => setCircleFill((old) => (old === 'blue' ? 'brown' : 'blue')),
    [setCircleFill]
  );

  const tapGestureSquare = Gesture.Tap().runOnJS(true).onEnd(switchSquareColor);
  const tapGestureCircle = Gesture.Tap().runOnJS(true).onEnd(switchCircleColor);

  return (
    <GestureHandlerRootView style={{ flex: 1, paddingTop: 200 }}>
      <Text>(Original issue: broken on iOS) Click on the shapes to change their color</Text>
      <View style={{ padding: 10, borderWidth: 1, alignSelf: 'flex-start' }}>
        <Svg width={200} height={200}>
          <GestureDetector gesture={tapGestureSquare}>
            <Path d={path} fill={squareFill} />
          </GestureDetector>
          <GestureDetector gesture={tapGestureCircle}>
            <Circle
              r={200}
              cx={210}
              cy={210}
              fill={circleFill}
            />
            {/* Or equivalently in a path - same behaviour */}
            {/* <Path d='M10,210a200,200 0 1,0 400,0a200,200 0 1,0 -400,0'  fill={circleFill} onResponderMove={() => {}} /> */}
          </GestureDetector>
        </Svg>
      </View>

      <Text>(With workaround) Click on the shapes to change their color</Text>
      <View style={{ padding: 10, borderWidth: 1, alignSelf: 'flex-start' }}>
        <Svg width={200} height={200}>
          <GestureDetector gesture={tapGestureSquare}>
            <Path d={path} fill={squareFill} onResponderMove={() => {}} />
          </GestureDetector>
          <GestureDetector gesture={tapGestureCircle}>
            <Circle
              r={200}
              cx={210}
              cy={210}
              fill={circleFill}
              onResponderMove={() => {}}
            />
            {/* Or equivalently in a path - same behaviour */}
            {/* <Path d='M10,210a200,200 0 1,0 400,0a200,200 0 1,0 -400,0'  fill={circleFill} onResponderMove={() => {}} /> */}
          </GestureDetector>
        </Svg>
      </View>
    </GestureHandlerRootView>
  );
}
