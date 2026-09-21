import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';

interface LoadingSkeletonProps {
  height?: number;
  width?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  height = 40,
  width = '100%',
  borderRadius = 8,
  style,
}) => {
  return (
    <View
      style={[
        styles.skeleton,
        { height, width: width as any, borderRadius },
        style,
      ]}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <View style={styles.cardSkeleton}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <LoadingSkeleton width={44} height={44} borderRadius={22} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <LoadingSkeleton width="60%" height={16} style={{ marginBottom: 6 }} />
        <LoadingSkeleton width="40%" height={12} />
      </View>
    </View>
    <LoadingSkeleton width="100%" height={24} borderRadius={6} />
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.borderLight,
    opacity: 0.7,
  },
  cardSkeleton: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
});
