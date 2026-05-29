import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../../api/analyticsApi';

interface PipelineValueWidgetProps {
  style?: React.CSSProperties;
  title?: string;
}

const PipelineValueWidget: React.FC<PipelineValueWidgetProps> = ({ 
  style, 
  title = "Pipeline Value" 
}) => {
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPipelineData();
  }, []);

  const loadPipelineData = async () => {
    try {
      const data = await analyticsApi.getPipelineForecast();
      setPipelineData(data);
    } catch (error) {
      logger.error('Error loading pipeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={style} className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  const totalValue = pipelineData?.totalPipelineValue || 0;
  const weightedValue = pipelineData?.weightedPipelineValue || 0;
  const accuracy = pipelineData?.forecastAccuracy || 0;

  return (
    <div style={style} className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Total Pipeline</span>
            <span className="text-xs text-gray-500">100%</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {analyticsApi.formatCurrency(totalValue)}
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Weighted Pipeline</span>
            <span className="text-xs text-gray-500">
              {totalValue > 0 ? Math.round((weightedValue / totalValue) * 100) : 0}%
            </span>
          </div>
          <div className="text-xl font-semibold text-green-600">
            {analyticsApi.formatCurrency(weightedValue)}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ 
                width: totalValue > 0 ? `${(weightedValue / totalValue) * 100}%` : '0%' 
              }}
            ></div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Forecast Accuracy</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{accuracy}%</span>
              <div className={`w-2 h-2 rounded-full ${
                accuracy >= 90 ? 'bg-green-500' : 
                accuracy >= 75 ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineValueWidget;
