"use client";

import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, TrendingUp, TrendingDown } from 'lucide-react';
import { Position } from '../types';

interface StockListProps {
  positions: Position[];
  onDragEnd: (result: DropResult) => void;
  onItemClick?: (symbol: string) => void;
  isDeleteMode?: boolean;
  onDelete?: (pos: Position) => void;
}

export default function StockList({ positions, onDragEnd, onItemClick, isDeleteMode, onDelete }: StockListProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => cancelAnimationFrame(animation);
  }, []);

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'KRW' ? 0 : 2,
    }).format(value);
  };

  // 컬럼 너비 비율 고정
  const colWidths = {
    handle: '5%',
    ticker: '15%',
    qty: '10%',
    cost: '12%',
    avg: '10%',
    price: '10%',
    value: '12%',
    change: '12%',
    weight: '14%',
  };

  if (!enabled) return null;

  return (
    // backdrop-blur 제거 (좌표 어긋남 방지)
    <div className="overflow-x-auto bg-gray-900 rounded-xl border border-gray-800">
      <DragDropContext onDragEnd={onDragEnd}>
        <table className="w-full text-left text-sm" style={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' }}>
          <thead className="bg-gray-800/50 text-gray-400 uppercase text-xs font-bold border-b border-gray-700">
            <tr>
              <th className="px-4 py-4 text-center" style={{ width: colWidths.handle }}></th>
              <th className="px-6 py-4" style={{ width: colWidths.ticker }}>티커</th>
              <th className="px-6 py-4 text-right" style={{ width: colWidths.qty }}>수량</th>
              <th className="px-6 py-4 text-right text-green-400" style={{ width: colWidths.cost }}>매입금액</th>
              <th className="px-6 py-4 text-right" style={{ width: colWidths.avg }}>평단가</th>
              <th className="px-6 py-4 text-right" style={{ width: colWidths.price }}>현재가</th>
              <th className="px-6 py-4 text-right" style={{ width: colWidths.value }}>평가금액 (USD)</th>
              <th className="px-6 py-4 text-right" style={{ width: colWidths.change }}>등락률</th>
              <th className="px-6 py-4 text-right" style={{ width: isDeleteMode ? '9%' : colWidths.weight }}>비중</th>
              {isDeleteMode && <th className="px-6 py-4 text-center text-red-400" style={{ width: '5%' }}>관리</th>}
            </tr>
          </thead>

          <Droppable droppableId="stock-table-body">
            {(provided) => (
              <tbody
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="divide-y divide-gray-800"
              >
                {positions.map((pos, index) => {
                  if (!pos) return null;
                  const dragId = pos.symbol; 
                  const valueInUsd = pos.valueUsd || 0;
                  const isPositive = (pos.daily_change_rate || 0) > 0;

                  return (
                    <Draggable key={dragId} draggableId={dragId} index={index}>
                      {(provided, snapshot) => {
                        const style = {
                          // 1. 라이브러리가 계산한 원래 크기와 위치를 최우선으로 가져옴
                          ...provided.draggableProps.style,
                          
                          // 2. 드래그 중일 때만 필요한 스타일 덮어쓰기
                          ...(snapshot.isDragging && {
                            display: 'table', // 테이블 모양 유지
                            tableLayout: 'fixed', 
                            // width: '100%',  <-- [삭제함] 이게 크기를 뻥튀기시킨 범인입니다!
                            borderSpacing: 0,
                            borderCollapse: 'collapse',
                            background: '#1f2937', 
                            boxShadow: '0 5px 20px rgba(0,0,0,0.6)',
                            border: '1px solid #374151',
                            borderRadius: '8px', // 드래그 중 살짝 둥글게
                          })
                        } as React.CSSProperties;

                        return (
                          <tr
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={style}
                            className={`group transition-colors ${
                              snapshot.isDragging 
                                ? 'z-50' 
                                : isDeleteMode ? 'hover:bg-red-900/10' : 'hover:bg-gray-800/30 cursor-pointer'
                            }`}
                            onDoubleClick={() => !isDeleteMode && onItemClick && onItemClick(pos.symbol)}
                          >
                            <td className="px-4 py-4 text-center" style={{ width: colWidths.handle }}>
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-200 flex justify-center p-1"
                              >
                                <GripVertical size={20} />
                              </div>
                            </td>
                            <td className="px-6 py-4" style={{ width: colWidths.ticker }}>
                              <div className="font-medium text-blue-300">{pos.symbol}</div>
                              <div className="text-xs text-gray-500 truncate">{pos.name || pos.sector}</div>
                            </td>
                            <td className="px-6 py-4 text-right text-gray-300" style={{ width: colWidths.qty }}>{pos.quantity}</td>
                            <td className="px-6 py-4 text-right font-medium text-green-300" style={{ width: colWidths.cost }}>
                              {pos.total_cost ? formatCurrency(pos.total_cost, pos.currency) : '-'}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-400" style={{ width: colWidths.avg }}>{formatCurrency(pos.avg_cost, pos.currency)}</td>
                            <td className="px-6 py-4 text-right text-gray-400" style={{ width: colWidths.price }}>
                                {pos.current_price ? formatCurrency(pos.current_price, pos.currency) : '-'}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-gray-200" style={{ width: colWidths.value }}>{formatCurrency(valueInUsd, 'USD')}</td>
                            <td className={`px-6 py-4 text-right font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`} style={{ width: colWidths.change }}>
                              <div className="flex items-center justify-end gap-1">
                                  {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                  {pos.daily_change_rate ? pos.daily_change_rate : 0}%
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right" style={{ width: isDeleteMode ? '9%' : colWidths.weight }}>
                              <div className="flex items-center justify-end gap-2">
                                <span className="w-12 text-right">{pos.weight}%</span>
                                <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(pos.weight || 0, 100)}%` }}></div>
                                </div>
                              </div>
                            </td>
                            {isDeleteMode && (
                              <td className="px-6 py-4 text-center" style={{ width: '5%' }}>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onDelete && onDelete(pos); }} 
                                  className="px-3 py-1 bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white rounded text-xs transition-colors cursor-pointer"
                                >
                                  삭제
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      }}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </tbody>
            )}
          </Droppable>
        </table>
      </DragDropContext>
    </div>
  );
}