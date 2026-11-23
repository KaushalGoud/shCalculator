import {
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium,
} from '@expo-google-fonts/cormorant-garamond';
import { Jost_300Light } from '@expo-google-fonts/jost';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useEffect, useReducer } from 'react';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalculatorButton, type ButtonVariant } from './src/components/CalculatorButton';
import {
  calculatorReducer,
  initialCalculatorState,
  normalizeCalculatorState,
  type CalculatorAction,
} from './src/calculator';
import { theme } from './src/theme';

const CANVAS_RATIO = 852 / 1846;

const backgroundImage = require('./assets/calculator-bg.png');

type KeyConfig = {
  label: string;
  accessibilityLabel: string;
  variant: ButtonVariant;
  action: CalculatorAction;
  left: number;
  top: number;
  width: number;
  height: number;
  fontSizeRatio?: number;
  useSystemFont?: boolean;
};

const columnLefts = [9.624, 31.103, 52.817, 74.178];
const rowTops = [45.125, 54.063, 62.73, 71.289, 79.632];
const keyWidth = 17.136;
const keyHeight = 6.988;
const bottomKeyHeight = 6.88;

const keys: KeyConfig[] = [
  { label: 'AC', accessibilityLabel: 'All clear', variant: 'utility', action: { type: 'clear' }, left: columnLefts[0], top: rowTops[0], width: keyWidth, height: keyHeight },
  { label: '⌫', accessibilityLabel: 'Backspace', variant: 'utility', action: { type: 'backspace' }, left: columnLefts[1], top: rowTops[0], width: keyWidth, height: keyHeight, fontSizeRatio: 0.046, useSystemFont: true },
  { label: '%', accessibilityLabel: 'Percent', variant: 'utility', action: { type: 'percent' }, left: columnLefts[2], top: rowTops[0], width: keyWidth, height: keyHeight },
  { label: '÷', accessibilityLabel: 'Divide', variant: 'operator', action: { type: 'operator', value: '÷' }, left: columnLefts[3], top: rowTops[0], width: keyWidth, height: keyHeight },
  { label: '7', accessibilityLabel: 'Seven', variant: 'number', action: { type: 'digit', value: '7' }, left: columnLefts[0], top: rowTops[1], width: keyWidth, height: keyHeight },
  { label: '8', accessibilityLabel: 'Eight', variant: 'number', action: { type: 'digit', value: '8' }, left: columnLefts[1], top: rowTops[1], width: keyWidth, height: keyHeight },
  { label: '9', accessibilityLabel: 'Nine', variant: 'number', action: { type: 'digit', value: '9' }, left: columnLefts[2], top: rowTops[1], width: keyWidth, height: keyHeight },
  { label: '×', accessibilityLabel: 'Multiply', variant: 'operator', action: { type: 'operator', value: 'x' }, left: columnLefts[3], top: rowTops[1], width: keyWidth, height: keyHeight },
  { label: '4', accessibilityLabel: 'Four', variant: 'number', action: { type: 'digit', value: '4' }, left: columnLefts[0], top: rowTops[2], width: keyWidth, height: keyHeight },
  { label: '5', accessibilityLabel: 'Five', variant: 'number', action: { type: 'digit', value: '5' }, left: columnLefts[1], top: rowTops[2], width: keyWidth, height: keyHeight },
  { label: '6', accessibilityLabel: 'Six', variant: 'number', action: { type: 'digit', value: '6' }, left: columnLefts[2], top: rowTops[2], width: keyWidth, height: keyHeight },
  { label: '−', accessibilityLabel: 'Subtract', variant: 'operator', action: { type: 'operator', value: '−' }, left: columnLefts[3], top: rowTops[2], width: keyWidth, height: keyHeight },
  { label: '1', accessibilityLabel: 'One', variant: 'number', action: { type: 'digit', value: '1' }, left: columnLefts[0], top: rowTops[3], width: keyWidth, height: keyHeight },
  { label: '2', accessibilityLabel: 'Two', variant: 'number', action: { type: 'digit', value: '2' }, left: columnLefts[1], top: rowTops[3], width: keyWidth, height: keyHeight },
  { label: '3', accessibilityLabel: 'Three', variant: 'number', action: { type: 'digit', value: '3' }, left: columnLefts[2], top: rowTops[3], width: keyWidth, height: keyHeight },
  { label: '+', accessibilityLabel: 'Add', variant: 'operator', action: { type: 'operator', value: '+' }, left: columnLefts[3], top: rowTops[3], width: keyWidth, height: keyHeight },
  { label: '±', accessibilityLabel: 'Toggle sign', variant: 'utility', action: { type: 'sign' }, left: columnLefts[0], top: rowTops[4], width: keyWidth, height: bottomKeyHeight },
  { label: '0', accessibilityLabel: 'Zero', variant: 'number', action: { type: 'digit', value: '0' }, left: columnLefts[1], top: rowTops[4], width: keyWidth, height: bottomKeyHeight },
  { label: '.', accessibilityLabel: 'Decimal point', variant: 'number', action: { type: 'decimal' }, left: columnLefts[2], top: rowTops[4], width: keyWidth, height: bottomKeyHeight },
  { label: '=', accessibilityLabel: 'Equals', variant: 'equals', action: { type: 'equals' }, left: columnLefts[3], top: rowTops[4], width: keyWidth, height: bottomKeyHeight },
];

const activeOperatorLabels: Record<string, string> = {
  '+': '+',
  '−': '−',
  x: '×',
  '÷': '÷',
};

function formatWithCommas(value: string): string {
  if (value === 'Error' || value.includes('e')) {
    return value;
  }

  const [integer, fraction = ''] = value.split('.');
  const hasDecimal = value.includes('.');
  const sign = integer.startsWith('-') ? '−' : '';
  const digits = sign ? integer.slice(1) : integer;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return `${sign}${grouped}${hasDecimal ? `.${fraction}` : ''}`;
}

function formatExpression(expression: string): string {
  return expression
    .replace(/-/g, '−')
    .replace(/x/g, '×')
    .replace(/\d+(?:\.\d+)?/g, (match) => formatWithCommas(match));
}

function keyFontSize(variant: ButtonVariant, canvasWidth: number): number {
  if (variant === 'operator') {
    return canvasWidth * 0.066;
  }

  if (variant === 'equals') {
    return canvasWidth * 0.076;
  }

  if (variant === 'utility') {
    return canvasWidth * 0.054;
  }

  return canvasWidth * 0.072;
}

function CalculatorScreen() {
  const [reducerState, dispatch] = useReducer(calculatorReducer, initialCalculatorState);
  const state = normalizeCalculatorState(reducerState);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_500Medium,
    Jost_300Light,
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Backspace') {
        event.preventDefault();
        dispatch({ type: 'backspace' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  const safeWidth = Math.max(width - insets.left - insets.right, 1);
  const safeHeight = Math.max(height - insets.top - insets.bottom, 1);
  const canvasWidth = Math.min(safeWidth, safeHeight * CANVAS_RATIO);
  const canvasHeight = canvasWidth / CANVAS_RATIO;

  const expression = formatExpression(state.expression);
  const result = formatWithCommas(state.display);
  const mainValue = state.showResult ? result : expression || formatWithCommas(state.display);
  const resultLength = mainValue.length;
  const mainFontSize =
    canvasWidth * (resultLength > 10 ? 0.078 : resultLength > 7 ? 0.105 : 0.155);
  const expressionFontSize = canvasWidth * 0.086;

  const trailingOperator = state.waitingForNewInput && !state.showResult
    ? state.expression.charAt(state.expression.length - 1)
    : '';
  const activeLabel = activeOperatorLabels[trailingOperator];

  if (!fontsLoaded && !fontError) {
    return <View style={styles.loading} />;
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar hidden style={theme.statusBar} />

      <View
        style={[
          styles.center,
          {
            paddingTop: insets.top,
            paddingRight: insets.right,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
          },
        ]}
      >
        <View style={{ width: canvasWidth, height: canvasHeight }}>
          <Image
            source={backgroundImage}
            style={{ width: canvasWidth, height: canvasHeight }}
            resizeMode="contain"
          />

          {state.showResult && expression.length > 0 ? (
            <Text
              style={[
                styles.expression,
                {
                  color: theme.ink,
                  fontFamily: fontsLoaded ? 'CormorantGaramond_400Regular' : undefined,
                  fontSize: expressionFontSize,
                  lineHeight: expressionFontSize * 1.1,
                  right: canvasWidth * 0.055,
                  top: canvasHeight * 0.236,
                  width: canvasWidth * 0.89,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.55}
            >
              {expression}
            </Text>
          ) : null}

          <Text
            style={[
              styles.value,
              {
                color: theme.ink,
                fontFamily: fontsLoaded ? 'CormorantGaramond_500Medium' : undefined,
                fontSize: mainFontSize,
                lineHeight: mainFontSize * 1.05,
                right: canvasWidth * 0.055,
                top: canvasHeight * 0.283,
                width: canvasWidth * 0.89,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.45}
          >
            {mainValue}
          </Text>

          {keys.map((key) => (
            <CalculatorButton
              key={key.label}
              label={key.label}
              accessibilityLabel={key.accessibilityLabel}
              variant={key.variant}
              theme={theme}
              left={(key.left / 100) * canvasWidth}
              top={(key.top / 100) * canvasHeight}
              width={(key.width / 100) * canvasWidth}
              height={(key.height / 100) * canvasHeight}
              fontSize={key.fontSizeRatio ? canvasWidth * key.fontSizeRatio : keyFontSize(key.variant, canvasWidth)}
              fontFamily={key.useSystemFont ? undefined : fontsLoaded ? 'Jost_300Light' : undefined}
              active={key.label === activeLabel}
              onPress={() => dispatch(key.action)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <CalculatorScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
  },
  loading: {
    flex: 1,
    backgroundColor: theme.background,
  },
  expression: {
    position: 'absolute',
    textAlign: 'right',
    includeFontPadding: false,
  },
  value: {
    position: 'absolute',
    textAlign: 'right',
    includeFontPadding: false,
  },
});
