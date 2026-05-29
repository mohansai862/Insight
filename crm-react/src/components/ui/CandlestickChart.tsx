import { logger } from '@/utils/logger';
/**
 * Candlestick Chart Component for Revenue Data
 */

import React from 'react';

interface CandlestickData {
  period: string;
  open: number;
  close: number;
  high: number;
  low: number;
  change: number;
  total: number;
}

interface CandlestickChartProps {
  data: CandlestickData[];
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
        <div className="text-lg">Loading revenue data...</div>
        <div className="text-sm">Fetching real data from database</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.high || 0));
  const minValue = Math.min(...data.map(d => d.low || 0));
  const range = Math.max(maxValue - minValue, 1000);
  const padding = range * 0.1;
  const chartHeight = 280;
  const chartWidth = Math.min(800, Math.max(500, data.length * 80));
  const barWidth = Math.max(20, Math.min(32, (chartWidth - 100) / data.length - 12));

  const getY = (value: number) => {
    return chartHeight - ((value - minValue + padding) / (range + 2 * padding)) * chartHeight;
  };

  const handleMouseMove = (e: React.MouseEvent, index: number) => {
    setHoveredIndex(index);
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  // DEBUG: Show exact data received
  logger.info('🔍 CandlestickChart received data:', JSON.stringify(data, null, 2));
  const latest = data && data.length > 0 ? data[data.length - 1] : null;
  const netChange = latest ? latest.change || 0 : 0;
  logger.info('📊 Latest data point:', JSON.stringify(latest, null, 2));
  
  // FORCE DISPLAY REAL VALUES
  if (latest) {
    logger.info('💰 DISPLAYING: Close=' + latest.close + ', Open=' + latest.open + ', High=' + latest.high + ', Low=' + latest.low);
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-6">
          <div>
            <div className="text-sm text-slate-500 font-medium">REVENUE ANALYSIS</div>
            <div className="flex items-baseline gap-3 mt-1">
              <div className="text-3xl font-extrabold text-slate-900">
                {latest?.close ? `$${latest.close.toLocaleString()}` : 'Loading...'}
              </div>
              {latest && (
                <div className={`text-sm font-semibold px-2 py-1 rounded ${
                  netChange >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}>
                  {netChange >= 0 ? "+" : ""}{netChange.toLocaleString()}
                </div>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-1">Monthly revenue trends with OHLC data</div>
          </div>

          {/* OHLC Stats */}
          {latest && (
            <div className="hidden md:flex items-center gap-6 text-sm text-slate-600">
              <div>
                <div className="text-xs text-slate-500">Open</div>
                <div className="font-medium">${latest.open ? latest.open.toLocaleString() : 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">High</div>
                <div className="font-medium">${latest.high ? latest.high.toLocaleString() : 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Low</div>
                <div className="font-medium">${latest.low ? latest.low.toLocaleString() : 'N/A'}</div>
              </div>
            </div>
          )}
        </div>


      </div>

      {/* Chart */}
      <div className="relative w-full overflow-hidden">
        <div className="w-full overflow-x-auto">
          <svg width={chartWidth} height={chartHeight + 50} className="min-w-full" viewBox={`0 0 ${chartWidth} ${chartHeight + 50}`} preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const value = minValue + ratio * range;
            const y = getY(value);
            return (
              <g key={ratio}>
                <line x1="50" y1={y} x2={chartWidth - 20} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                <text x="45" y={y + 4} textAnchor="end" fontSize="12" fill="#6b7280">
                  ${(value / 1000).toFixed(0)}K
                </text>
              </g>
            );
          })}
          
          {/* Vertical Grid lines */}
          {data.map((_, index) => {
            const x = 60 + index * (barWidth + 15) + barWidth / 2;
            return (
              <line key={`v-${index}`} x1={x} y1="0" x2={x} y2={chartHeight} stroke="#f3f4f6" strokeWidth="1" opacity="0.5" />
            );
          })}
          
          {/* Candlesticks */}
          {data.map((item, index) => {
            const x = 60 + index * (barWidth + 15);
            const isPositive = item.close >= item.open;
            const bodyTop = Math.max(item.open, item.close);
            const bodyBottom = Math.min(item.open, item.close);
            const bodyHeight = Math.max(Math.abs(getY(bodyBottom) - getY(bodyTop)), 4);
            
            return (
              <g key={index}>
                {/* Upper Shadow */}
                <line
                  x1={x + barWidth / 2}
                  y1={getY(item.high)}
                  x2={x + barWidth / 2}
                  y2={getY(bodyTop)}
                  stroke="#000000"
                  strokeWidth={2}
                />
                {/* Lower Shadow */}
                <line
                  x1={x + barWidth / 2}
                  y1={getY(bodyBottom)}
                  x2={x + barWidth / 2}
                  y2={getY(item.low)}
                  stroke="#000000"
                  strokeWidth={2}
                />
                {/* Candlestick Body */}
                <rect
                  x={x + 4}
                  y={getY(bodyTop)}
                  width={barWidth - 8}
                  height={bodyHeight}
                  fill={isPositive ? '#16A34A' : '#FFFFFF'}
                  stroke={isPositive ? '#16A34A' : '#DC2626'}
                  strokeWidth={1.5}
                  onMouseEnter={(e) => handleMouseMove(e, index)}
                  onMouseMove={(e) => handleMouseMove(e, index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{ cursor: 'pointer' }}
                />
                {/* X-axis label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#6b7280"
                >
                  {item.period.split('-')[1]}
                </text>
              </g>
            );
          })}
          </svg>
        </div>
        
        {/* Tooltip */}
        {/* @ts-ignore */}
        {/* @ts-ignore */}
        {hoveredIndex !== null && (
          <div
            className="fixed bg-white p-3 border rounded-lg shadow-lg z-50 pointer-events-none"
            style={{
              left: mousePos.x + 10,
              top: mousePos.y - 10,
              transform: 'translate(0, -100%)'
            }}
          >
            <p className="font-medium text-gray-900 mb-2">{data[hoveredIndex!].period}</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-600">Opening Revenue:</span>
                <span className="font-medium">${data[hoveredIndex!].open?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-600">Closing Revenue:</span>
                <span className="font-medium">${data[hoveredIndex!].close?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-600">Highest Revenue:</span>
                <span className="font-medium">${data[hoveredIndex!].high?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-600">Lowest Revenue:</span>
                <span className="font-medium">${data[hoveredIndex!].low?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-4 border-t pt-1">
                <span className="text-gray-600">Net Change:</span>
                <span className={`font-medium ${
                  data[hoveredIndex!].change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {data[hoveredIndex!].change >= 0 ? '+' : ''}${data[hoveredIndex!].change?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandlestickChart;
