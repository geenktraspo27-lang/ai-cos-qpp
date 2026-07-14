export const campaignStatusColor = (status: string): string => {
  if (status === '配信中') return '#3FA45B';
  if (status === '準備中') return '#C7823B';
  return '#2E7CD6';
};
