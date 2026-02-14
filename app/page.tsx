'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import PortfolioTreemap from '../components/PortfolioTreemap'; 
import AddHoldingModal from '../components/AddHoldingModal';   
import StockList from '../components/StockList';               
import { Position } from '../types';                           
import { DropResult } from '@hello-pangea/dnd';
import { getStockPrice } from './actions'; // 서버 액션 사용

// 1. 초기 데이터
const MOCK_DATA: Position[] = [
  { symbol: 'NVDA', name: 'NVIDIA', sector: 'Tech', quantity: 10, avg_cost: 450, currency: 'USD' },
  { symbol: 'TSLA', name: 'Tesla', sector: 'Auto', quantity: 20, avg_cost: 200, currency: 'USD' },
  { symbol: 'AAPL', name: 'Apple', sector: 'Tech', quantity: 15, avg_cost: 180, currency: 'USD' },
];

// 2. 계산 로직
const calculatePortfolio = (positions: Position[]) => {
  let totalValueUsd = 0;
  let totalCostUsd = 0;
  
  const updated = positions.map(p => {
    const currentPrice = p.current_price || p.avg_cost; 
    const valueUsd = p.quantity * currentPrice;
    const totalCost = p.quantity * p.avg_cost;
    
    totalValueUsd += valueUsd;
    totalCostUsd += totalCost;
    
    return { 
      ...p, 
      valueUsd, 
      total_cost: totalCost, 
      current_price: currentPrice,
      daily_change_rate: p.daily_change_rate || 0 
    };
  });

  const final = updated.map(p => ({
    ...p,
    weight: totalValueUsd > 0 ? parseFloat(((p.valueUsd / totalValueUsd) * 100).toFixed(2)) : 0
  }));

  const profitLoss = totalValueUsd - totalCostUsd;
  const returnRate = totalCostUsd > 0 ? (profitLoss / totalCostUsd) * 100 : 0;

  return { 
    totalValueUsd, totalCostUsd, totalProfitLoss: profitLoss, 
    totalReturnRate: returnRate, updatedPositions: final 
  };
};

export default function DashboardPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Position | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // 시세 갱신 (서버 액션 사용)
  const refreshAllPrices = useCallback(async () => {
    if (positions.length === 0) return;
    setIsRefreshing(true);

    try {
      const promises = positions.map(async (p) => {
        const data = await getStockPrice(p.symbol);
        
        if (data.success && data.price !== null && data.price !== undefined) {
          return {
            ...p,
            current_price: data.price,
            daily_change_rate: parseFloat((data.changeRate || 0).toFixed(2))
          };
        }
        return p; 
      });

      const newPositions = await Promise.all(promises);
      setPositions(newPositions);
    } catch (error) {
      console.error("갱신 중 오류 발생:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [positions]);

  useEffect(() => {
    const animation = requestAnimationFrame(() => {
        const savedData = localStorage.getItem('baco_portfolio_data');
        if (savedData) {
            setPositions(JSON.parse(savedData));
        } else {
            setPositions(MOCK_DATA);
        }
        setIsLoaded(true);
    });
    return () => cancelAnimationFrame(animation);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('baco_portfolio_data', JSON.stringify(positions));
    }
  }, [positions, isLoaded]);

  const { totalValueUsd, totalCostUsd, totalProfitLoss, totalReturnRate, updatedPositions } = useMemo(() => {
    if (!isLoaded) return { totalValueUsd: 0, totalCostUsd: 0, totalProfitLoss: 0, totalReturnRate: 0, updatedPositions: [] };
    return calculatePortfolio(positions);
  }, [positions, isLoaded]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(positions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setPositions(items);
  };

  const handleSavePosition = (newPosition: Position) => {
    setPositions(prev => {
      if (editingIndex !== null) {
        const next = [...prev];
        next[editingIndex] = newPosition;
        return next;
      }
      return [newPosition, ...prev];
    });
    setIsModalOpen(false);
    setEditingIndex(null);
  };

  const openEditModal = (symbol: string) => {
    const idx = positions.findIndex(p => p.symbol === symbol);
    if (idx !== -1) {
      setEditingIndex(idx);
      setIsModalOpen(true);
      setIsMenuOpen(false);
    }
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      setPositions(prev => prev.filter(p => p.symbol !== deleteTarget.symbol));
      setDeleteTarget(null);
      if (positions.length <= 1) setIsDeleteMode(false);
    }
  };

  const formatCurrency = (value: number, currency: 'USD' | 'KRW') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: currency, minimumFractionDigits: currency === 'KRW' ? 0 : 2,
    }).format(value);
  };

  if (!isLoaded) return <div className="min-h-screen bg-gray-950"></div>;

  const isProfit = totalProfitLoss >= 0;
  const pnlColor = isProfit ? 'text-green-400' : 'text-red-400';
  const pnlBg = isProfit ? 'bg-green-400/10' : 'bg-red-400/10';

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-12 font-sans relative">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-gray-950 to-gray-950"></div>
      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        {/* 헤더 */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">baco Portfolio</h1>
            <p className="text-gray-500 text-sm mt-1">Interactive Dashboard</p>
          </div>
          <div className="flex gap-2">
            <button onClick={refreshAllPrices} disabled={isRefreshing} className={`px-4 py-2 text-sm font-bold rounded-md border border-gray-700 transition-all ${isRefreshing ? 'cursor-not-allowed text-gray-400' : 'cursor-pointer text-green-400 hover:text-green-300'}`}>
              {isRefreshing ? '갱신 중...' : '⚡ 시세 갱신'}
            </button>
            <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800">
              <button onClick={() => setViewMode('list')} className={`px-4 py-2 text-sm font-medium rounded-md cursor-pointer ${viewMode === 'list' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200'}`}>List</button>
              <button onClick={() => setViewMode('map')} className={`px-4 py-2 text-sm font-medium rounded-md cursor-pointer ${viewMode === 'map' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200'}`}>Map</button>
            </div>
          </div>
        </header>

        {/* 요약 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900/50 backdrop-blur rounded-xl p-6 border border-gray-800">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Total Assets</h3>
            <div className="text-3xl font-bold text-white">{formatCurrency(totalValueUsd, 'USD')}</div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur rounded-xl p-6 border border-gray-800">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Total Invested</h3>
            <div className="text-3xl font-bold text-gray-300">{formatCurrency(totalCostUsd, 'USD')}</div>
          </div>
          <div className={`bg-gray-900/50 backdrop-blur rounded-xl p-6 border border-gray-800 ${pnlBg}`}>
            <h3 className="text-gray-400 text-sm font-medium mb-2">Profit/Loss</h3>
            <div className={`text-3xl font-bold ${pnlColor}`}>{totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(totalProfitLoss, 'USD')}</div>
            <div className={`text-sm mt-1 font-bold ${pnlColor}`}>{totalReturnRate.toFixed(2)}%</div>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        {viewMode === 'map' ? (
          <section className="bg-white/5 rounded-xl border border-gray-800 p-4 min-h-[500px]">
            <PortfolioTreemap positions={updatedPositions} />
          </section>
        ) : (
          <section className="space-y-4">
            <div className="flex justify-between items-center px-2">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-200">
                  보유 종목
                  {isDeleteMode && <span className="text-red-400 text-xs bg-red-400/10 px-2 py-1 rounded border border-red-400/20">삭제 모드</span>}
                </h2>
                <div className="relative">
                  <button onClick={() => isDeleteMode ? setIsDeleteMode(false) : setIsMenuOpen(!isMenuOpen)} className={`px-4 py-2 text-white text-xs font-bold rounded shadow-lg transition-all flex items-center gap-2 cursor-pointer ${isDeleteMode ? 'bg-red-600' : 'bg-blue-600'}`}>
                    {isDeleteMode ? '관리 종료' : '종목 관리 ▼'}
                  </button>
                  {isMenuOpen && !isDeleteMode && (
                    <div className="absolute right-0 top-full mt-2 w-32 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-20">
                      <button onClick={() => { setIsModalOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 border-b border-gray-700 cursor-pointer">+ 종목 등록</button>
                      <button onClick={() => { setIsDeleteMode(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-900/30 cursor-pointer">- 종목 삭제</button>
                    </div>
                  )}
                </div>
            </div>
            
            <StockList 
              positions={updatedPositions} 
              onDragEnd={handleDragEnd} 
              onItemClick={openEditModal}
              isDeleteMode={isDeleteMode}
              onDelete={(pos) => setDeleteTarget(pos)}
            />
          </section>
        )}
      </div>

      <AddHoldingModal 
        isOpen={isModalOpen} 
        onClose={() => {setIsModalOpen(false); setEditingIndex(null);}} 
        onSave={handleSavePosition} 
        initialData={editingIndex !== null ? positions[editingIndex] : null} 
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">삭제 확인</h3>
            <p className="text-gray-300 text-sm mb-6">{deleteTarget.symbol} 삭제하시겠습니까?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 cursor-pointer">취소</button>
              <button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 hover:bg-red-500 rounded text-white font-bold cursor-pointer">삭제</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}