import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import type { Theme } from '../theme';

export type ButtonVariant = 'number' | 'utility' | 'operator' | 'equals';

type CalculatorButtonProps = {
  label: string;
  accessibilityLabel: string;
  variant: ButtonVariant;
  theme: Theme;
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily?: string;
  active?: boolean;
  onPress: () => void;
};

export function CalculatorButton({
  label,
  accessibilityLabel,
  variant,
  theme,
  left,
  top,
  width,
  height,
  fontSize,
  fontFamily,
  active = false,
  onPress,
}: CalculatorButtonProps) {
  const colors = {
    number: { background: theme.number, text: theme.ink },
    utility: { background: theme.utility, text: theme.ink },
    operator: { background: theme.operator, text: theme.ink },
    equals: { background: theme.equals, text: theme.ink },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      android_ripple={{ color: theme.ink }}
      style={({ pressed }) => [
        styles.button,
        {
          left,
          top,
          width,
          height,
          borderRadius: variant === 'number' && width > height * 1.4 ? height / 2 : width / 2,
          backgroundColor: colors.background,
          borderColor: variant === 'number' ? theme.numberLine : colors.background,
          opacity: pressed ? 0.8 : 1,
        },
        active && styles.active,
        Platform.OS === 'ios' && styles.shadow,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: colors.text,
            fontFamily,
            fontSize,
            lineHeight: fontSize * 1.12,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  label: {
    textAlign: 'center',
    includeFontPadding: false,
  },
  active: {
    shadowColor: '#8c4b66',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 2,
  },
  shadow: {
    shadowColor: '#e282a5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
  },
});
