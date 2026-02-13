'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Position } from '../types';

interface AddHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newPosition: Position) => void;
  initialData?: Position | null;
}

export default function AddHoldingModal({ isOpen, onClose, onSave, initialData }: AddHoldingModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const symbolInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Position>>({
    symbol: '',
    name: '',
    quantity: 0,
    avg_cost: 0,
    total_cost: 0,
    current_price: 0,
    currency: 'USD',
    sector: 'Technology',
    daily_change_rate: 0,
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({ ...initialData });
      } else {
        setFormData({ 
          symbol: '', name: '', quantity: 0, avg_cost: 0, total_cost: 0,
          current_price: 0, currency: 'USD', sector: 'Technology', daily_change_rate: 0 
        });
        
        setTimeout(() => {
          if (symbolInputRef.current) {
            symbolInputRef.current.focus();
          }
        }, 100);
      }
      setErrorMsg('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const fetchStockInfo = async () => {
    if (!formData.symbol) return;
    
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/stock?symbol=${formData.symbol}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch');
      }

      setFormData(prev => ({
        ...prev,
        name: data.name,
        current_price: data.current_price,
        sector: data.sector,
        daily_change_rate: data.daily_change_rate,
        currency: data.currency,
      }));

    } catch (err) {
      console.error(err);
      setErrorMsg('종목 정보를 찾을 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      symbol: formData.symbol!.toUpperCase(),
      name: formData.name || formData.symbol,
      quantity: Number(formData.quantity),
      avg_cost: Number(formData.avg_cost),
      total_cost: Number(formData.total_cost),
      current_price: Number(formData.current_price),
      currency: formData.currency as 'USD' | 'KRW',
      sector: formData.sector || 'Etc',
      daily_change_rate: Number(formData.daily_change_rate),
      weight: 0,
      updated_at: new Date().toISOString(),
    } as Position);
    
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      fetchStockInfo();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-4">
          {initialData ? '종목 수정 (Edit Asset)' : '종목 등록 (Add Asset)'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 1. 티커 */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">티커 (Symbol)</label>
            <div className="flex gap-2">
              <input 
                ref={symbolInputRef}
                type="text" 
                required
                className="flex-1 bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none uppercase"
                placeholder="예: TSLA"
                value={formData.symbol}
                onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                onClick={fetchStockInfo}
                disabled={isLoading || !formData.symbol}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {isLoading ? '검색 중...' : '종목 검색'}
              </button>
            </div>
            {errorMsg && <p className="text-red-400 text-xs mt-1">{errorMsg}</p>}
          </div>

          {/* 2. 종목명 (수정됨: 작은 따옴표 제거) */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">종목명 (Stock Name)</label>
            <input 
              type="text" 
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-gray-300 font-medium focus:outline-none cursor-not-allowed"
              value={formData.name || ''}
              placeholder="종목 검색을 누르면 자동 입력됩니다" 
              readOnly 
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* 수량 */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">수량 (Qty)</label>
              <input 
                type="number" 
                required
                step="any"
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value)})}
              />
            </div>

            {/* 매입금액 */}
            <div>
              <label className="block text-xs text-green-400 mb-1 font-bold">매입금액 (Cost)</label>
              <input 
                type="number" 
                required
                step="any"
                className="w-full bg-gray-800 border border-green-500/50 rounded p-2 text-white focus:border-green-500 outline-none"
                value={formData.total_cost || ''}
                onChange={(e) => setFormData({...formData, total_cost: parseFloat(e.target.value)})}
              />
            </div>

            {/* 평단가 */}
            <div>
              <label className="block text-xs text-blue-400 mb-1 font-bold">평단가 (Avg)</label>
              <input 
                type="number" 
                required
                step="any"
                className="w-full bg-gray-800 border border-blue-500/50 rounded p-2 text-white focus:border-blue-500 outline-none"
                value={formData.avg_cost || ''}
                onChange={(e) => setFormData({...formData, avg_cost: parseFloat(e.target.value)})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* 현재가 */}
             <div>
              <label className="block text-xs text-gray-400 mb-1">현재가 (Price)</label>
              <input 
                type="number" 
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-gray-400 focus:outline-none cursor-not-allowed"
                value={formData.current_price || ''}
                readOnly
              />
            </div>
             {/* 통화 */}
             <div>
              <label className="block text-xs text-gray-400 mb-1">통화 (Currency)</label>
              <select 
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                value={formData.currency}
                onChange={(e) => setFormData({...formData, currency: e.target.value as 'USD' | 'KRW'})}
              >
                <option value="USD">USD ($)</option>
                <option value="KRW">KRW (₩)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 섹터 */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">섹터 (Sector)</label>
              <input 
                type="text" 
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-gray-400 focus:border-blue-500 outline-none cursor-not-allowed"
                value={formData.sector}
                readOnly
              />
            </div>
             {/* 등락률 */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">등락률 (Change %)</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-gray-400 focus:border-blue-500 outline-none cursor-not-allowed"
                value={formData.daily_change_rate || ''}
                readOnly
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
            >
              취소
            </button>
            <button 
              type="submit" 
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold transition-colors shadow-lg shadow-blue-500/20"
            >
              {initialData ? '수정 완료' : '등록 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}