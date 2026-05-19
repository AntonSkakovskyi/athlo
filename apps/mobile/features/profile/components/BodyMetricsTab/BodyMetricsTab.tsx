import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { DatePicker } from '@/components/ui/DatePicker/DatePicker';
import { BottomSheet, BottomSheetItem } from '@/components/ui/BottomSheet/BottomSheet';
import { LineChartBlock } from '@/components/ui/LineChartBlock/LineChartBlock';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { useBodyMetricsTab } from '../../hooks/useBodyMetricsTab';

export function BodyMetricsTab() {
  const {
    metricTypes,
    metricTypesLoading,
    selectedMetricId,
    setSelectedMetricId,
    selectedMetricType,
    bodyPeriod,
    setBodyPeriod,
    metricSheetVisible,
    setMetricSheetVisible,
    value,
    setValue,
    date,
    setDate,
    bodyChartData,
    metricsHistory,
    handleSave,
    handleDelete,
    createMetricPending,
    PERIOD_LABELS,
  } = useBodyMetricsTab();

  if (metricTypesLoading) {
    return <Spinner style={styles.loader} />;
  }

  if (!metricTypes || metricTypes.length === 0) {
    return <EmptyState title="No metric types available" description="Body metric types will appear here" />;
  }

  return (
    <View style={styles.container}>
      {/* Metric Selector Button */}
      <View style={styles.selectorWrap}>
        <Text style={styles.sectionTitle}>Select Metric</Text>
        <Pressable
          style={styles.filterBtn}
          onPress={() => setMetricSheetVisible(true)}
        >
          <Text style={styles.filterBtnText} numberOfLines={1}>
            {selectedMetricType?.name ?? 'Select Metric...'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Chart */}
      {selectedMetricType && bodyChartData.length > 0 ? (
        <View style={styles.chartSection}>
          <LineChartBlock
            metricLabel={selectedMetricType.name}
            data={bodyChartData}
            period={bodyPeriod}
            onPeriodChange={setBodyPeriod}
            periods={PERIOD_LABELS}
            emptyText="No measurements recorded for this metric"
          />
        </View>
      ) : (
        <View style={styles.noDataChart}>
          <Text style={styles.noDataText}>No data available for this metric.</Text>
        </View>
      )}

      {/* Add New Entry Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Log New Entry</Text>
        <View style={styles.formRow}>
          <View style={styles.formCol}>
            <Input
              placeholder={`Value${selectedMetricType?.unit ? ` (${selectedMetricType.unit.name})` : ''}`}
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              containerStyle={styles.noMargin}
            />
          </View>
          <View style={styles.formCol}>
            <DatePicker
              value={date}
              onChange={setDate}
              maximumDate={new Date()}
            />
          </View>
        </View>
        <Button
          title="Add Entry"
          variant="primary"
          onPress={handleSave}
          isLoading={createMetricPending}
          disabled={!value || !selectedMetricId}
          style={styles.addBtn}
        />
      </View>

      {/* History List */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>History</Text>
        {metricsHistory && metricsHistory.length > 0 ? (
          metricsHistory.map((metric) => (
            <View key={metric.id} style={styles.historyRow}>
              <View>
                <Text style={styles.historyValue}>
                  {metric.value} {metric.metricType?.unit?.name ?? ''}
                </Text>
                <Text style={styles.historyDate}>
                  {new Date(metric.recordedAt).toLocaleDateString()}
                </Text>
              </View>
              <Pressable onPress={() => handleDelete(metric.id)} hitSlop={10}>
                <Text style={styles.deleteBtn}>✕</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={styles.emptyHistory}>No history yet.</Text>
        )}
      </View>

      <BottomSheet
        visible={metricSheetVisible}
        onClose={() => setMetricSheetVisible(false)}
        title="Select Metric"
      >
        {metricTypes?.map((type) => (
          <BottomSheetItem
            key={type.id}
            label={type.name}
            onPress={() => {
              setSelectedMetricId(type.id);
              setMetricSheetVisible(false);
            }}
          />
        ))}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    marginVertical: spacing['4xl'],
  },
  selectorWrap: {
    marginBottom: spacing.lg,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  filterBtnText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  chartSection: {
    marginBottom: spacing.xl,
  },
  noDataChart: {
    height: 200,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noDataText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  section: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  formCol: {
    flex: 1,
  },
  noMargin: {
    marginBottom: 0,
  },
  addBtn: {
    marginTop: spacing.xs,
  },
  historySection: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  historyValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  historyDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  deleteBtn: {
    fontSize: 18,
    color: colors.danger,
    padding: spacing.xs,
  },
  emptyHistory: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
