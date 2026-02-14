import { Position } from '../types';

export const mockPositions: Position[] = [
  { 
    id: '1', 
    symbol: 'NVDA', 
    name: 'NVIDIA', 
    sector: 'Technology', 
    quantity: 10, 
    avg_cost: 480.5, 
    currency: 'USD',
    current_price: 500,
    daily_change_rate: 2.5,
    valueUsd: 5000
  },
  { 
    id: '2', 
    symbol: 'TSLA', 
    name: 'Tesla', 
    sector: 'Consumer Cyclical', 
    quantity: 20, 
    avg_cost: 190.0, 
    currency: 'USD',
    current_price: 180,
    daily_change_rate: -1.2,
    valueUsd: 3600
  },
  { 
    id: '3', 
    symbol: 'PLTR', 
    name: 'Palantir', 
    sector: 'Technology', 
    quantity: 100, 
    avg_cost: 15.5, 
    currency: 'USD',
    current_price: 25,
    daily_change_rate: 5.4,
    valueUsd: 2500
  },
];


//강강묵 바보 <- 반사