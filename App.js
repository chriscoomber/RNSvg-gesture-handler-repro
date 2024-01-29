import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import { View, Text } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { useState, useCallback } from 'react';

export default function App() {
  const path = 'M 0 0 L 0 50 L 50 50 L 50 0 Z';

  const [fill, setFill] = useState('red');
  const switchColor = useCallback(() => setFill(old => old === 'red' ? 'green' : 'red'), [setFill]);

  const tapGesture = Gesture.Tap()
    .runOnJS(true)
    .onEnd(switchColor);

  return (
    <GestureHandlerRootView style={{ flex: 1, paddingTop: 200 }}>
      <Text>Click on the square to change color</Text>
      <View style={{ padding: 10, borderWidth: 1, alignSelf: 'flex-start' }}>
        <Svg width={100} height={100}>
          <GestureDetector gesture={tapGesture}>
            <Path d={path} fill={fill} />
          </GestureDetector>
        </Svg>
      </View>
    </GestureHandlerRootView>
  );
}
