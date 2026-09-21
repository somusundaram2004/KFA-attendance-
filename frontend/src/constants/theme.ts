export const COLORS = {
  primary: '#1E40AF',          // Deep Navy Blue
  primaryDark: '#0F172A',      // Slate Dark
  primaryLight: '#3B82F6',     // Royal Blue
  secondary: '#2563EB',        // Bright Blue
  accent: '#D4AF37',           // Classic Gold
  accentLight: '#FEF08A',      // Soft Gold Tint
  background: '#F8FAFC',      // Crisp Off-White Background
  card: '#FFFFFF',            // Pure White Card
  cardHover: '#F1F5F9',       // Soft Tint
  text: '#0F172A',            // High Contrast Dark Slate Text
  textSecondary: '#475569',   // Slate Subtext
  textMuted: '#94A3B8',       // Light Slate Muted Text
  border: '#E2E8F0',          // Subtle Border
  borderLight: '#F1F5F9',     // Ultra-light Divider
  
  // Status Colors
  success: '#059669',
  successBg: '#ECFDF5',
  successLight: '#ECFDF5',
  successBorder: '#A7F3D0',

  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  dangerLight: '#FEF2F2',
  dangerBorder: '#FECACA',

  warning: '#D97706',
  warningBg: '#FFFBEB',
  warningLight: '#FFFBEB',
  warningBorder: '#FDE68A',

  info: '#2563EB',
  infoBg: '#EFF6FF',
  infoLight: '#EFF6FF',
  infoBorder: '#BFDBFE',

  late: '#7C3AED',
  lateBg: '#F5F3FF',
  lateBorder: '#DDD6FE',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36,
};

export const TYPOGRAPHY = {
  h1: { fontSize: 24, fontWeight: '700' as const, color: COLORS.text, letterSpacing: -0.5 },
  h2: { fontSize: 18, fontWeight: '700' as const, color: COLORS.text, letterSpacing: -0.3 },
  h3: { fontSize: 15, fontWeight: '600' as const, color: COLORS.text, letterSpacing: -0.2 },
  body: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  caption: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' as const },
  subtitle: { fontSize: 13, color: COLORS.textSecondary },
  label: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const },
};

export const SHADOWS = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
};
