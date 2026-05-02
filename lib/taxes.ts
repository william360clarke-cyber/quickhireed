// Ghana statutory levies applied to service transactions
export const TAX_RATES = {
  VAT: 0.15,
  NHIL: 0.025,
  GETFUND: 0.025,
};

export const TOTAL_TAX_RATE = TAX_RATES.VAT + TAX_RATES.NHIL + TAX_RATES.GETFUND; // 0.20

export const COMMISSION_RATE = 0.10;

export function calculateTaxes(serviceAmount: number) {
  const vat = serviceAmount * TAX_RATES.VAT;
  const nhil = serviceAmount * TAX_RATES.NHIL;
  const getfund = serviceAmount * TAX_RATES.GETFUND;
  const totalTax = vat + nhil + getfund;
  const total = serviceAmount + totalTax;
  return { vat, nhil, getfund, totalTax, total };
}

export function calculatePayout(grossAmount: number, paymentMethod: string) {
  const commission = grossAmount * COMMISSION_RATE;
  const taxes = calculateTaxes(grossAmount);
  // Cash payments: provider pays commission separately; card/momo: deducted upfront
  const taxDeducted = paymentMethod !== "cash" ? taxes.totalTax : 0;
  const payout = grossAmount - commission - taxDeducted;
  return {
    grossAmount,
    commissionAmount: commission,
    taxAmount: taxDeducted,
    payoutAmount: payout,
  };
}
