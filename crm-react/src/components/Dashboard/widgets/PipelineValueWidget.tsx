import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { analyticsApi, PipelineForecast, formatCurrency } from '../../../../../../../frontend/src/api/analyticsApi';

export const PipelineValueWidget: React.FC = () => {
  const [pipelineData, setPipelineData] = useState<PipelineForecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPipelineData();
  }, []);

  const loadPipelineData = async () => {
    try {
      const data = await analyticsApi.getPipelineForecast();
      setPipelineData(data);
    } catch (error) {
      logger.error('Failed to load pipeline data:', error);
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

  if (!pipelineData) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No pipeline data available
      </div>
    );
  }

  const weightedPercentage = pipelineData.totalPipelineValue > 0 
    ? (pipelineData.weightedPipelineValue / pipelineData.totalPipelineValue) * 100 
    : 0;

  return (
    <div className="h-full">
      <h3 className="text-lg font-semibold mb-4">Pipeline Value</h3>
      
      <div className="space-y-4">
        {/* Total Pipeline Value */}
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Total Pipeline</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(pipelineData.totalPipelineValue)}
          </div>
        </div>

        {/* Weighted Pipeline Value */}
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Weighted Pipeline</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(pipelineData.weightedPipelineValue)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {weightedPercentage.toFixed(1)}% of total
          </div>
        </div>

        {/* Open Deals Count */}
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Open Deals</span>
          <span className="text-lg font-bold text-gray-900">
            {pipelineData.openDealsCount}
          </span>
        </div>

        {/* Average Deal Size */}
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Avg Deal Size</span>
          <span className="text-lg font-bold text-gray-900">
            {pipelineData.openDealsCount > 0 
              ? formatCurrency(pipelineData.totalPipelineValue / pipelineData.openDealsCount)
              : formatCurrency(0)
            }
          </span>
        </div>
      </div>
    </div>
  );
};
