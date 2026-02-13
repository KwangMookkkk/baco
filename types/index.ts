export interface Position {
  id?: string;                // 드래그용 고유 ID
  symbol: string;             // 티커
  name: string;               // 종목명
  sector: string;             // 섹터
  quantity: number;           // 수량
  avg_cost: number;           // 평단가
  currency: 'USD' | 'KRW';    // 통화
  current_price?: number;     // 현재가
  daily_change_rate?: number; // 등락률
  weight?: number;            // 비중
  total_cost?: number;        // 총 매입금
  valueUsd?: number;          // 평가금액
}