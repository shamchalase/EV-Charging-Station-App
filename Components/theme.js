// Design system tokens for VoltCharge EV Charging App

export const Colors = {
  // Brand Colors
  primary: '#05B66B',        // Electric Green
  primaryDark: '#047857',
  primaryLight: '#E8FDF3',
  primaryNeon: '#00D084',
  primaryGradientStart: '#05B66B',
  primaryGradientEnd: '#00D084',

  // Accent Colors
  accentOrange: '#FF7A00',   // Energy Orange
  accentOrangeLight: '#FFF4EB',
  accentBlue: '#0284C7',     // Cyber Sky Blue
  accentBlueLight: '#E0F2FE',
  accentPurple: '#7C3AED',
  accentPurpleLight: '#F3E8FF',

  // Neutrals (Clean Slate)
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceCard: '#FFFFFF',
  surfaceElevated: '#F1F5F9',
  surfaceDark: '#0F172A',
  surfaceDarkCard: '#1E293B',

  // Text Colors
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textWhite: '#FFFFFF',
  textSuccess: '#05B66B',
  textWarning: '#D97706',
  textDanger: '#DC2626',

  // Status & Feedback
  success: '#10B981',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Borders & Dividers
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#05B66B',
  divider: '#CBD5E1',

  // Overlays
  overlayDark: 'rgba(15, 23, 42, 0.65)',
  overlayLight: 'rgba(255, 255, 255, 0.85)',
};

export const Shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#05B66B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
};

export const Typography = {
  fontFamily: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    title: 28,
    hero: 34,
  },
  weights: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },
};

export const BorderRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  full: 9999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36,
};
