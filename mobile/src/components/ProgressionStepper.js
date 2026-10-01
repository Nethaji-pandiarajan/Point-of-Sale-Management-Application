import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, Bell, Utensils } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

export default function ProgressionStepper({ currentStage = 'ready' }) {
  // Stages: 'placed' (1) -> 'kot' (2) -> 'prepped' (3) -> 'ready' (4) -> 'served' (5)
  const stages = [
    { key: 'placed', label: 'Placed' },
    { key: 'kot', label: 'KOT' },
    { key: 'prepped', label: 'Prepped' },
    { key: 'ready', label: 'Ready' },
    { key: 'served', label: 'Serve' },
  ];

  const stageOrder = {
    pending: 1,
    placed: 1,
    kot: 2,
    preparing: 3,
    prepped: 3,
    ready: 4,
    served: 5,
    completed: 5,
  };

  const currentIdx = stageOrder[currentStage.toLowerCase()] || 4;

  return (
    <View style={styles.container}>
      <Text style={styles.headerLabel}>ORDER PROGRESSION</Text>
      <View style={styles.stepperRow}>
        {stages.map((stage, idx) => {
          const stepNum = idx + 1;
          const isDone = stepNum < currentIdx;
          const isCurrent = stepNum === currentIdx;
          const isUpcoming = stepNum > currentIdx;

          return (
            <React.Fragment key={stage.key}>
              {/* Connector line between steps */}
              {idx > 0 && (
                <View
                  style={[
                    styles.connector,
                    stepNum <= currentIdx ? styles.connectorDone : styles.connectorPending,
                  ]}
                />
              )}

              {/* Step Icon & Label */}
              <View style={styles.stepCol}>
                <View
                  style={[
                    styles.circle,
                    isDone && styles.circleDone,
                    isCurrent && styles.circleCurrent,
                    isUpcoming && styles.circleUpcoming,
                  ]}
                >
                  {isDone ? (
                    <Check size={14} color={colors.onTertiary} strokeWidth={3} />
                  ) : isCurrent ? (
                    stage.key === 'ready' ? (
                      <Bell size={15} color={colors.onTertiary} strokeWidth={2.5} />
                    ) : (
                      <Check size={14} color={colors.onTertiary} strokeWidth={3} />
                    )
                  ) : (
                    <Utensils size={13} color={colors.onSurfaceVariant} />
                  )}

                  {isCurrent && stage.key === 'ready' && (
                    <View style={styles.pulsePing} />
                  )}
                </View>

                <Text
                  style={[
                    styles.stepLabel,
                    isCurrent ? styles.stepLabelCurrent : isDone ? styles.stepLabelDone : styles.stepLabelUpcoming,
                  ]}
                  numberOfLines={1}
                >
                  {stage.label}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerLabel: {
    ...typography.captionSm,
    color: colors.onSurfaceVariant,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 14,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepCol: {
    alignItems: 'center',
    width: 48,
    zIndex: 2,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circleDone: {
    backgroundColor: colors.tertiaryContainer,
  },
  circleCurrent: {
    backgroundColor: colors.tertiaryContainer,
    shadowColor: colors.tertiaryContainer,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  circleUpcoming: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  pulsePing: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.tertiaryFixed,
  },
  connector: {
    flex: 1,
    height: 2.5,
    marginHorizontal: -4,
    marginBottom: 18,
    zIndex: 1,
  },
  connectorDone: {
    backgroundColor: colors.tertiaryContainer,
  },
  connectorPending: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  stepLabel: {
    ...typography.captionSm,
    marginTop: 6,
    textAlign: 'center',
  },
  stepLabelDone: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  stepLabelCurrent: {
    color: colors.tertiaryContainer,
    fontWeight: '800',
  },
  stepLabelUpcoming: {
    color: colors.onSurfaceVariant,
    opacity: 0.6,
  },
});
