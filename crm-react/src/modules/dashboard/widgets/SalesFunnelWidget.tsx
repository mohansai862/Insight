import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../../api/analyticsApi';

interface SalesFunnelWidgetProps {
  style?: React.CSSProperties;
  title?: string;
}

const SalesFunnelWidget: React.FC<SalesFunnelWidgetProps> = ({ 
  style, 
  title = "Sales Funnel" 
}) => {
  const [funnelData, setFunnelData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFunnelData();
  }, []);

  const loadFunnelData = async () => {
    try {
      const data = await analyticsApi.getSalesFunnel();
      setFunnelData(data);
    } catch (error) {
      logger.error('Error loading funnel data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={style} className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stages = [
    { name: 'Leads', value: funnelData?.leads || 0, color: 'bg-blue-500' },
    { name: 'Qualified', value: funnelData?.qualified || 0, color: 'bg-green-500' },
    { name: 'Proposals', value: funnelData?.proposals || 0, color: 'bg-yellow-500' },
    { name: 'Negotiations', value: funnelData?.negotiations || 0, color: 'bg-orange-500' },
    { name: 'Closed Won', value: funnelData?.closed_won || 0, color: 'bg-purple-500' }
  ];

  const maxValue = Math.max(...stages.map(s => s.value));

  return (
    <div style={style} className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const width = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
          const conversionRate = index > 0 ? ((stage.value / stages[index - 1].value) * 100).toFixed(1) : '100.0';
          
          return (
            <div key={stage.name} className="relative">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold">{stage.value}</span>
                  {index > 0 && (
                    <span className="text-xs text-gray-500">({conversionRate}%)</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                  <div 
                    className={`h-full ${stage.color} transition-all duration-500 ease-out rounded-full`}
                    style={{ width: `${width}%` }}
                  >
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-900 min-w-[40px] text-right">
                  {stage.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Overall Conversion:</span>
          <span className="font-medium">
            {maxValue > 0 ? ((stages[stages.length - 1].value / stages[0].value) * 100).toFixed(1) : 0}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default SalesFunnelWidget;
