import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { analyticsApi, SalesFunnelData } from '../../../../../../../frontend/src/api/analyticsApi';

export const SalesFunnelWidget: React.FC = () => {
  const [funnelData, setFunnelData] = useState<SalesFunnelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFunnelData();
  }, []);

  const loadFunnelData = async () => {
    try {
      const data = await analyticsApi.getSalesFunnel();
      setFunnelData(data);
    } catch (error) {
      logger.error('Failed to load funnel data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!funnelData) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No funnel data available
      </div>
    );
  }

  const funnelStages = [
    { label: 'Total Leads', value: funnelData.totalLeads, color: 'bg-blue-500', width: '100%' },
    { label: 'Qualified Leads', value: funnelData.qualifiedLeads, color: 'bg-green-500', width: '80%' },
    { label: 'Total Deals', value: funnelData.totalDeals, color: 'bg-yellow-500', width: '60%' },
    { label: 'Closed Won', value: funnelData.closedWonDeals, color: 'bg-purple-500', width: '40%' }
  ];

  return (
    <div className="h-full">
      <h3 className="text-lg font-semibold mb-4">Sales Funnel</h3>
      <div className="space-y-3">
        {funnelStages.map((stage, index) => (
          <div key={index} className="relative">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">{stage.label}</span>
              <span className="text-sm font-bold">{stage.value}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-8">
                <div 
                  className={`${stage.color} h-full rounded-full transition-all duration-500`}
                  style={{ width: stage.width }}
                >
                </div>
              </div>
              <span className="text-sm font-bold text-gray-900 min-w-[30px]">{stage.value}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">Conversion Rate</div>
        <div className="text-xl font-bold text-green-600">
          {funnelData.conversionRate.toFixed(1)}%
        </div>
      </div>
    </div>
  );
};
