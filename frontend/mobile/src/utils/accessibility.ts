import { Platform, PixelRatio } from 'react-native';

export function a11n(label: string, hint?: string, role?: string) {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityRole: role,
  } as const;
}

export function dynamicFontSize(base: number): number {
  const scale = PixelRatio.getFontScale();
  return Math.round(base * Math.min(Math.max(scale, 0.85), 1.5));
}

export const A11N_ROLES = {
  button: 'button' as const,
  header: 'header' as const,
  image: 'image' as const,
  link: 'link' as const,
  text: 'text' as const,
  list: 'list' as const,
  search: 'search' as const,
  tab: 'tab' as const,
  adjust: 'adjustable' as const,
  summary: 'summary' as const,
};

export function accessibleButton(label: string, hint?: string) {
  return {
    accessible: true,
    accessibilityRole: 'button' as const,
    accessibilityLabel: label,
    accessibilityHint: hint,
  };
}

export function accessibleImage(label: string) {
  return {
    accessible: true,
    accessibilityRole: 'image' as const,
    accessibilityLabel: label,
  };
}

export const REDUCE_MOTION = Platform.OS === 'web'
  ? typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  : false;
