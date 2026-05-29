import React from 'react';
import { DashboardLayout } from '../../../../../../frontend/src/api/analyticsApi';
import { SalesFunnelWidget } from './widgets/SalesFunnelWidget';
import { PipelineValueWidget } from './widgets/PipelineValueWidget';
import { MonthlyRevenueWidget } from './widgets/MonthlyRevenueWidget';

interface DashboardGridProps {
  layout: DashboardLayout;
  userRole: string;
  onLayoutChange: (layout: DashboardLayout) => void;
}

interface WidgetConfig {
  type: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({ 
  layout, 
  userRole, 
  onLayoutChange 
}) => {
  const widgets: WidgetConfig[] = JSON.parse(layout.widgets);

  const renderWidget = (widget: WidgetConfig) => {
    const baseClasses = "bg-white rounded-lg shadow border p-4 flex-1 min-w-[300px]";
    const flexClasses = `min-h-[${widget.position.h * 100}px]`;
    
    switch (widget.type) {
      case 'SalesFunnel':
        return (
          <div key={widget.type} className={`${baseClasses} ${flexClasses}`}>
            <SalesFunnelWidget />
          </div>
        );
      case 'PipelineValue':
        return (
          <div key={widget.type} className={`${baseClasses} ${flexClasses}`}>
            <PipelineValueWidget />
          </div>
        );
      case 'RevenueTrends':
      case 'MonthlyRevenue':
        return (
          <div key={widget.type} className={`${baseClasses} ${flexClasses}`}>
            <MonthlyRevenueWidget />
          </div>
        );
      case 'QuotaAttainment':
        return (
          <div key={widget.type} className={`${baseClasses} ${flexClasses}`}>
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Quota Attainment</h3>
                <div className="text-3xl font-bold text-green-600">85%</div>
                <div className="text-sm text-gray-500">of monthly quota</div>
              </div>
            </div>
          </div>
        );
      case 'UpcomingTasks':
        return (
          <div key={widget.type} className={`${baseClasses} ${flexClasses}`}>
            <div>
              <h3 className="text-lg font-semibold mb-4">Upcoming Tasks</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm">Follow up with ABC Corp</span>
                  <span className="text-xs text-gray-500">Today</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm">Prepare proposal for XYZ Ltd</span>
                  <span className="text-xs text-gray-500">Tomorrow</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm">Client meeting preparation</span>
                  <span className="text-xs text-gray-500">Friday</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'TopDeals':
        return (
          <div key={widget.type} className={`${baseClasses} ${flexClasses}`}>
            <div>
              <h3 className="text-lg font-semibold mb-4">Top Deals</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 border-b">
                  <div>
                    <div className="font-medium">Enterprise Software Deal</div>
                    <div className="text-sm text-gray-500">ABC Corporation</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">$250,000</div>
                    <div className="text-sm text-green-600">90% probability</div>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 border-b">
                  <div>
                    <div className="font-medium">Cloud Migration Project</div>
                    <div className="text-sm text-gray-500">XYZ Industries</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">$180,000</div>
                    <div className="text-sm text-yellow-600">75% probability</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div key={widget.type} className={`${baseClasses} ${flexClasses}`}>
            <div className="h-full flex items-center justify-center text-gray-500">
              Widget: {widget.type}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-wrap gap-4">
      {widgets.map(renderWidget)}
    </div>
  );
};