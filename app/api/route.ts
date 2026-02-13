/* eslint-disable */
// @ts-nocheck
import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    // [문제의 핵심 해결] 
    // 1. import는 default로 했지만 (빌드 통과용)
    // 2. 에러 메시지("Call new YahooFinance first")를 해결하기 위해
    //    강제로 new를 붙여서 인스턴스를 만듭니다.
    const client = new (yahooFinance as any)();

    console.log(`Fetching data for: ${symbol}`);

    // 생성된 client 객체로 데이터를 요청합니다.
    const quote = await client.quote(symbol);
    const summary = await client.quoteSummary(symbol, { modules: ['summaryProfile'] });

    if (!quote) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
    }

    const data = {
      symbol: quote.symbol,
      name: quote.shortName || quote.longName || symbol,
      currency: quote.currency || 'USD',
      current_price: quote.regularMarketPrice || 0,
      daily_change_rate: quote.regularMarketChangePercent || 0,
      sector: summary?.summaryProfile?.sector || 'Etc',
    };

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Yahoo Finance API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch data',
      details: error?.message 
    }, { status: 500 });
  }
}