"use client";

import React from 'react';
import { Treemap, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    // 수익률 계산: ((현재가 - 평단가) / 평단가) * 100
    const totalReturn = (data.current_price && data.avg_cost) 
      ? ((data.current_price - data.avg_cost) / data.avg_cost) * 100 
      : 0;

    return (
      <div className="bg-gray-900 text-white p-4 rounded-lg shadow-xl text-sm border border-gray-700 z-50 min-w-[200px]">
        <div className="mb-3 border-b border-gray-700 pb-2">
          <p className="font-bold text-lg text-blue-300">{data.symbol}</p>
          <p className="text-gray-400 text-xs">{data.name}</p>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">평가금액:</span>
            <span className="font-mono font-bold">${data.valueUsd?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">현재가:</span>
            <span className="font-mono">${data.current_price?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">평단가:</span>
            <span className="font-mono text-gray-500">${data.avg_cost?.toFixed(2)}</span>
          </div>
          <div className="h-px bg-gray-700 my-2"></div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">일일 변동:</span>
            <span className={data.daily_change_rate > 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
              {data.daily_change_rate > 0 ? '▲' : '▼'} {data.daily_change_rate}%
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">총 수익률:</span>
            <span className={totalReturn >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
              {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, symbol, daily_change_rate } = props;
  const change = daily_change_rate || 0;
  const isPositive = change >= 0;
  const bgColor = isPositive ? '#4ade80' : '#f87171'; 
  const opacity = Math.min(Math.abs(change) / 5 + 0.3, 1);

  return (
    <g>
      <rect
        x={x} y={y} width={width} height={height}
        style={{ fill: bgColor, fillOpacity: opacity, stroke: '#111827', strokeWidth: 1 }}
      />
      {width > 30 && height > 30 && (
        <text
          x={x + width / 2} y={y + height / 2}
          textAnchor="middle" fill="#fff" fontSize={12} fontWeight="bold" dy={4}
          style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.5)' }}
        >
          {symbol}
        </text>
      )}
    </g>
  );
};

export default function PortfolioTreemap({ positions }: { positions: any[] })
 {
  if (!positions || positions.length === 0) return <div className="text-gray-500 text-center py-20">데이터 없음</div>;

  const safeData = positions.map(p => ({
    ...p,
    size: p.valueUsd || 0 
  })).filter(p => p.size > 0); 

  return (
    <ResponsiveContainer width="100%" height={500}>
      <Treemap
        data={safeData}
        dataKey="size"
        aspectRatio={4 / 3}
        stroke="#fff"
        content={<CustomTreemapContent />}
        animationDuration={400}
      >
        <Tooltip content={<CustomTooltip />} cursor={false} />
      </Treemap>
    </ResponsiveContainer>
  );
}