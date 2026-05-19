import { useState, useMemo } from 'react';
import { useGetMetricTypes, useCreateBodyMetric, useGetBodyMetrics, useDeleteBodyMetric } from '@/hooks/api/useBodyMetricAPI';
import { useBodyMetricProgress } from '@/features/profile/hooks';
import { getScopeRange } from '@/utils/date';

type Scope = '3m' | '1y' | 'all';

const SCOPE_MAP: Record<string, Scope> = {
  '3 Months': '3m',
  '1 Year': '1y',
  'All Time': 'all',
};

export const PERIOD_LABELS = ['3 Months', '1 Year', 'All Time'];

export function useBodyMetricsTab() {
  const { data: metricTypes, isLoading: metricTypesLoading } = useGetMetricTypes();
  const createMetric = useCreateBodyMetric();
  const deleteMetric = useDeleteBodyMetric();

  // State
  const [selectedMetricId, setSelectedMetricId] = useState<number | null>(null);
  const [bodyPeriod, setBodyPeriod] = useState('3 Months');
  const [metricSheetVisible, setMetricSheetVisible] = useState(false);
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date());

  // Set default metric to Body Weight
  useMemo(() => {
    if (!selectedMetricId && metricTypes && metricTypes.length > 0) {
      const weightMetric = metricTypes.find(t => t.name === 'Body Weight');
      if (weightMetric) setSelectedMetricId(weightMetric.id);
      else setSelectedMetricId(metricTypes[0].id);
    }
  }, [metricTypes, selectedMetricId]);

  const selectedMetricType = metricTypes?.find(t => t.id === selectedMetricId);
  const selectedMetricIdStr = selectedMetricId ? String(selectedMetricId) : '';

  // Chart data
  const bodyScope = SCOPE_MAP[bodyPeriod] ?? '3m';
  const { from: bodyFrom, to: bodyTo } = getScopeRange(bodyScope);
  const { data: bodyMetricData } = useBodyMetricProgress(selectedMetricIdStr, bodyFrom, bodyTo);

  const bodyChartData = useMemo(() => {
    return (bodyMetricData?.history ?? []).map((h) => ({
      date: h.date,
      value: h.value,
    }));
  }, [bodyMetricData]);

  // History data
  const { data: metricsHistory } = useGetBodyMetrics(selectedMetricIdStr || undefined);

  const handleSave = async () => {
    if (!selectedMetricType || !value) return;

    try {
      const parsedValue = parseFloat(value);
      if (!isNaN(parsedValue) && parsedValue > 0) {
        await createMetric.mutateAsync({
          metricTypeId: selectedMetricType.id,
          value: parsedValue,
          recordedAt: date.toISOString(),
        });
        setValue('');
        setDate(new Date());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = (id: number) => {
    deleteMetric.mutate(String(id));
  };

  return {
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
    createMetricPending: createMetric.isPending,
    PERIOD_LABELS,
  };
}
