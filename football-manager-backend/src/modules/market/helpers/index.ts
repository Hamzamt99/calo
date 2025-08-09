// Helper to compute final sale price (95 % of asking)
export function computeFinalPrice(askingPrice: number): number {
  return parseFloat((askingPrice * 0.95).toFixed(2));
}
