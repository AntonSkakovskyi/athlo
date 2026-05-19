import type { IWorkoutChartPoint } from '@athlo/shared';

export interface AggregatedPoint {
  label: string;      // Simple label for X-axis (e.g., "12/4")
  headerLabel: string; // Detailed label for the header (e.g., "Last week")
  value: number;
  date: string;       // Start date of the bucket for sorting/reference
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function aggregateByWeek(data: IWorkoutChartPoint[], fromDate: Date, toDate: Date, getValue: (p: IWorkoutChartPoint) => number): AggregatedPoint[] {
  const buckets: Record<string, number> = {};
  
  // Initialize buckets for all weeks in range
  const current = new Date(fromDate);
  // Adjust to start of week (Monday)
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  current.setDate(diff);
  current.setHours(0, 0, 0, 0);

  while (current <= toDate) {
    const key = current.toISOString().split('T')[0];
    buckets[key] = 0;
    current.setDate(current.getDate() + 7);
  }

  // Fill buckets
  data.forEach(point => {
    const pDate = new Date(point.date);
    const pDay = pDate.getDay();
    const pDiff = pDate.getDate() - pDay + (pDay === 0 ? -6 : 1);
    pDate.setDate(pDiff);
    pDate.setHours(0, 0, 0, 0);
    
    const key = pDate.toISOString().split('T')[0];
    if (buckets[key] !== undefined) {
      buckets[key] += getValue(point);
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDay = today.getDay();
  const todayDiff = today.getDate() - todayDay + (todayDay === 0 ? -6 : 1);
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(todayDiff);
  currentWeekStart.setHours(0, 0, 0, 0);

  return Object.entries(buckets).map(([date, value]) => {
    const start = new Date(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const diffWeeks = Math.round((currentWeekStart.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));

    let headerLabel: string;
    if (diffWeeks === 0) {
      headerLabel = 'This week';
    } else if (diffWeeks === 1) {
      headerLabel = 'Last week';
    } else if (diffWeeks > 1 && diffWeeks <= 2) {
      headerLabel = `${diffWeeks} weeks ago`;
    } else {
      const startDay = start.getDate();
      const startMonth = monthNames[start.getMonth()];
      const endDay = end.getDate();
      const endMonth = monthNames[end.getMonth()];

      if (start.getMonth() === end.getMonth()) {
        headerLabel = `${startDay}-${endDay} ${startMonth}`;
      } else {
        headerLabel = `${startDay} ${startMonth.slice(0, 3)} - ${endDay} ${endMonth.slice(0, 3)}`;
      }
    }

    const label = `${start.getDate()}/${start.getMonth() + 1}`;

    return { label, headerLabel, value, date };
  }).sort((a, b) => a.date.localeCompare(b.date));
}

export function aggregateByMonth(data: IWorkoutChartPoint[], fromDate: Date, toDate: Date, getValue: (p: IWorkoutChartPoint) => number): AggregatedPoint[] {
  const buckets: Record<string, number> = {};
  
  // Initialize buckets for all months in range
  const current = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  
  while (current <= toDate) {
    const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    buckets[key] = 0;
    current.setMonth(current.getMonth() + 1);
  }

  // Fill buckets
  data.forEach(point => {
    const pDate = new Date(point.date);
    const key = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
    if (buckets[key] !== undefined) {
      buckets[key] += getValue(point);
    }
  });

  return Object.entries(buckets).map(([key, value]) => {
    const [year, month] = key.split('-');
    const label = `${monthNames[parseInt(month) - 1]}`;
    return { label, headerLabel: `${label} ${year}`, value, date: `${key}-01` };
  }).sort((a, b) => a.date.localeCompare(b.date));
}
