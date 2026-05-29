import { logger } from '@/utils/logger';
import React from 'react';
import { DashboardLayout } from '../../../api/analyticsApi';
import SalesFunnelWidget from '../widgets/SalesFunnelWidget';
import PipelineValueWidget from '../widgets/PipelineValueWidget';
import MonthlyRevenueWidget from '../widgets/MonthlyRevenueWidget';
import QuotaAttainmentWidget from '../widgets/QuotaAttainmentWidget';
import TopDealsWidget from '../widgets/TopDealsWidget';
import UpcomingTasksWidget from '../widgets/UpcomingTasksWidget';
import LeadsBySourceWidget from '../widgets/LeadsBySourceWidget';
import TeamLeaderboardWidget from '../widgets/TeamLeaderboardWidget';

interface DashboardGridProps {
  dashboard: DashboardLayout | null;
}

const DashboardGrid: React.FC<DashboardGridProps> = ({ dashboard }) => {
  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-gray-500">No dashboard selected</p>
      </div>
    );
  }

  const renderWidget = (widget: any) => {
    const { type, position } = widget;
    const style = {
      gridColumn: `span ${position.w}`,
      gridRow: `span ${position.h}`,
    };

    switch (type) {
      case 'SalesFunnelWidget':
        return <SalesFunnelWidget key={type} style={style} />;
      case 'PipelineValueWidget':
        return <PipelineValueWidget key={type} style={style} />;
      case 'MonthlyRevenueWidget':
        return <MonthlyRevenueWidget key={type} style={style} />;
      case 'QuotaAttainmentWidget':
        return <QuotaAttainmentWidget key={type} style={style} />;
      case 'TopDealsWidget':
        return <TopDealsWidget key={type} style={style} />;
      case 'UpcomingTasksWidget':
        return <UpcomingTasksWidget key={type} style={style} />;
      case 'LeadsBySourceWidget':
        return <LeadsBySourceWidget key={type} style={style} />;
      case 'TeamLeaderboardWidget':
        return <TeamLeaderboardWidget key={type} style={style} />;
      case 'MyPipelineValue':
        return <PipelineValueWidget key={type} style={style} title="My Pipeline Value" />;
      case 'MyQuotaAttainment':
        return <QuotaAttainmentWidget key={type} style={style} title="My Quota Attainment" />;
      case 'MyOpenTasks':
        return <UpcomingTasksWidget key={type} style={style} title="My Open Tasks" limit={5} />;
      case 'MyActivitiesThisWeek':
        return <div key={type} style={style} className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">My Activities This Week</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Calls</span>
              <span className="font-medium">24</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Emails</span>
              <span className="font-medium">18</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Meetings</span>
              <span className="font-medium">7</span>
            </div>
          </div>
        </div>;
      case 'MyUpcomingDeals':
        return <TopDealsWidget key={type} style={style} title="My Upcoming Deals" />;
      case 'TeamPipelineOverview':
        return <PipelineValueWidget key={type} style={style} title="Team Pipeline Overview" />;
      case 'TeamActivitySummary':
        return <div key={type} style={style} className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Team Activity Summary</h3>
          <div className="flex gap-4">
            <div className="text-center flex-1">
              <div className="text-2xl font-bold text-blue-600">156</div>
              <div className="text-sm text-gray-500">Total Calls</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-2xl font-bold text-green-600">89</div>
              <div className="text-sm text-gray-500">Total Meetings</div>
            </div>
          </div>
        </div>;
      case 'TopPerformers':
        return <TeamLeaderboardWidget key={type} style={style} title="Top Performers" />;
      case 'AtRiskDeals':
        return <div key={type} style={style} className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">At-Risk Deals</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">Acme Corp Deal</div>
                <div className="text-sm text-gray-500">$50,000 • Close: Tomorrow</div>
              </div>
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">High Risk</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">TechStart Partnership</div>
                <div className="text-sm text-gray-500">$75,000 • Close: Next Week</div>
              </div>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Medium Risk</span>
            </div>
          </div>
        </div>;
      case 'NewLeadsThisWeek':
        return <div key={type} style={style} className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">New Leads This Week</h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">23</div>
            <div className="text-sm text-gray-500 mt-2">+15% from last week</div>
          </div>
        </div>;
      case 'RevenueTrends':
        return <MonthlyRevenueWidget key={type} style={style} title="Revenue Trends" />;
      case 'PipelineByManager':
        return <div key={type} style={style} className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pipeline by Manager</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">John Smith</span>
              <span className="font-medium">$450K</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sarah Johnson</span>
              <span className="font-medium">$380K</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mike Davis</span>
              <span className="font-medium">$320K</span>
            </div>
          </div>
        </div>;
      case 'WinRateByTeam':
        return <div key={type} style={style} className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Win Rate by Team</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Enterprise Sales</span>
              <span className="font-medium">42%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">SMB Sales</span>
              <span className="font-medium">38%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Inside Sales</span>
              <span className="font-medium">35%</span>
            </div>
          </div>
        </div>;
      case 'SalesForecast':
        return <div key={type} style={style} className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Forecast</h3>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">$1.2M</div>
            <div className="text-sm text-gray-500 mt-1">Projected Q4 Revenue</div>
            <div className="text-xs text-green-600 mt-2">↗ 12% vs Q3</div>
          </div>
        </div>;
      default:
        return (
          <div key={type} style={style} className="bg-white rounded-lg shadow p-4">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">📊</div>
              <p>Widget: {type}</p>
            </div>
          </div>
        );
    }
  };

  let widgets;
  try {
    widgets = JSON.parse(dashboard.widgets);
  } catch (e) {
    logger.error('Error parsing dashboard widgets:', e);
    widgets = [];
  }

  return (
    <div className="flex flex-wrap gap-4">
      {widgets.map((widget: any, index: number) => renderWidget({ ...widget, key: index }))}
    </div>
  );
};

export default DashboardGrid;
