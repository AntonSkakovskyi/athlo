export class ColumnNumericTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string): number | null {
    const n = parseFloat(data);
    return isNaN(n) ? null : n;
  }
}
