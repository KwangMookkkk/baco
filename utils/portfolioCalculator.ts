import { Position } from '../types';

export const calculatePortfolio = (positions: Position[]) => {
  let totalValueUsd = 0;
  let totalCostUsd = 0;

  const updatedPositions = positions.map((p) => {
    // 현재가가 없으면 평단가로 계산 (에러 방지)
    const currentPrice = p.current_price || p.avg_cost;
    const valueUsd = p.quantity * currentPrice;
    const totalCost = p.quantity * p.avg_cost;

    totalValueUsd += valueUsd;
    totalCostUsd += totalCost;

    return {
      ...p,
      current_price: currentPrice,
      valueUsd: valueUsd,
      total_cost: totalCost,
      // 등락률이 없으면 0으로 처리
      daily_change_rate: p.daily_change_rate || 0,
      // id가 없으면 symbol을 id로 사용
      id: p.id || p.symbol,
    };
  });

  // 비중(Weight) 계산
  const finalPositions = updatedPositions.map((p) => ({
    ...p,
    weight: totalValueUsd > 0 
      ? parseFloat(((p.valueUsd / totalValueUsd) * 100).toFixed(2)) 
      : 0,
  }));

  const totalProfitLoss = totalValueUsd - totalCostUsd;
  const totalReturnRate = totalCostUsd > 0 ? (totalProfitLoss / totalCostUsd) * 100 : 0;

  return {
    totalValueUsd,
    totalCostUsd,
    totalProfitLoss,
    totalReturnRate,
    updatedPositions: finalPositions,
  };
};