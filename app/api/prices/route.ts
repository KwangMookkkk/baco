import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) return NextResponse.json({ error: 'Symbol required' }, { status: 400 });

  try {
    // [핵심 수정] 야후 파이낸스 차단 우회: 실제 브라우저인 척 속임 (User-Agent 추가)
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!res.ok) throw new Error(`Yahoo Blocked or Failed: ${res.status}`);

    const data = await res.json();
    const result = data.chart.result?.[0];

    if (!result || !result.meta) throw new Error('No Data');

    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose;
    
    // 등락률 계산
    const changeRate = ((currentPrice - prevClose) / prevClose) * 100;

    return NextResponse.json({
      price: currentPrice,
      changeRate: changeRate
    });

  } catch (e) {
    console.error(`[API Fail] ${symbol}:`, e);
    // 실패하면 null을 반환해서 기존 가격 유지
    return NextResponse.json({ price: null, changeRate: null }, { status: 200 });
  }
}