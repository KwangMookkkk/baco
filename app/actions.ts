'use server'

export async function getStockPrice(symbol: string) {
  try {
    // 야후 파이낸스 차단 우회용 헤더 (사람인 척 위장)
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    };

    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, {
      cache: 'no-store', // 무조건 최신 데이터
      headers: headers
    });

    if (!res.ok) {
      throw new Error(`Yahoo Finance Error: ${res.status}`);
    }

    const data = await res.json();
    const result = data.chart.result?.[0];

    if (!result || !result.meta) {
      throw new Error('No Data Found');
    }

    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose;
    
    // 등락률 계산
    const changeRate = ((currentPrice - prevClose) / prevClose) * 100;

    return { 
      success: true,
      price: currentPrice, 
      changeRate: changeRate 
    };

  } catch (error) {
    console.error(`[Stock Error] ${symbol}:`, error);
    return { success: false, price: null, changeRate: null };
  }
}