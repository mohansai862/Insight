import axios from 'axios';

const API_BASE_URL = '/api';

export interface DashboardWidget {
  type: string;
  name: string;
  description: string;
  category: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface DashboardLayout {
  layoutId?: number;
  layoutName: string;
  userId?: number;
  role?: string;
  widgets: string;
  isDefault?: boolean;
  createdDate?: string;
}

export interface CustomReport {
  reportId?: number;
  reportName: string;
  description?: string;
  reportType: 'Table' | 'Chart' | 'Dashboard';
  entityType: string;
  columns?: string;
  filters?: string;
  groupBy?: string;
  sortBy?: string;
  chartType?: 'Bar' | 'Line' | 'Pie' | 'Donut' | 'Area' | 'Scatter' | 'Funnel';
  createdBy?: number;
  createdDate?: string;
  isPublic?: boolean;
  scheduleFrequency?: 'None' | 'Daily' | 'Weekly' | 'Monthly';
}

export interface AnalyticsData {
  salesFunnel?: any;
  pipelineForecast?: any;
  leadConversion?: any;
  salesByRep?: any[];
  revenueTrends?: any;
  activitiesSummary?: any;
  winLossAnalysis?: any;
  quotaAttainment?: any;
  customerLifetimeValue?: any;
}

class AnalyticsApi {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'X-User-Id': userId || '1',
      'X-User-Role': userRole || 'Sales_Manager'
    };
  }

  // Analytics APIs
  async getSalesFunnel(dateRange = '30'): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/analytics/sales-funnel`, {
      params: { dateRange },
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getPipelineForecast(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/analytics/pipeline-forecast`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getLeadConversion(dateRange = '30'): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/analytics/lead-conversion`, {
      params: { dateRange },
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getSalesByRep(teamId?: number, dateRange = '30'): Promise<any[]> {
    const params: any = { dateRange };
    if (teamId) params.teamId = teamId;

    const response = await axios.get(`${API_BASE_URL}/analytics/sales-by-rep`, {
      params,
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getRevenueTrends(dateRange = '12'): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/analytics/revenue-trends`, {
      params: { dateRange },
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getActivitiesSummary(dateRange = '30'): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/analytics/activities-summary`, {
      params: { dateRange },
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getWinLossAnalysis(dateRange = '90'): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/analytics/win-loss-analysis`, {
      params: { dateRange },
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getQuotaAttainment(period = 'month'): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/analytics/quota-attainment`, {
      params: { period },
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getCustomerLifetimeValue(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/analytics/customer-lifetime-value`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getKpiSummary(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/analytics/kpi-summary`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  // Dashboard APIs
  async getDashboards(): Promise<DashboardLayout[]> {
    const response = await axios.get(`${API_BASE_URL}/dashboards`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getDefaultDashboard(): Promise<DashboardLayout> {
    const response = await axios.get(`${API_BASE_URL}/dashboards/default`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getDashboardById(id: number): Promise<DashboardLayout> {
    const response = await axios.get(`${API_BASE_URL}/dashboards/${id}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async createDashboard(dashboard: DashboardLayout): Promise<DashboardLayout> {
    const response = await axios.post(`${API_BASE_URL}/dashboards`, dashboard, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async updateDashboard(id: number, dashboard: DashboardLayout): Promise<DashboardLayout> {
    const response = await axios.put(`${API_BASE_URL}/dashboards/${id}`, dashboard, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async deleteDashboard(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/dashboards/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  async getAvailableWidgets(): Promise<any[]> {
    const response = await axios.get(`${API_BASE_URL}/dashboards/widgets`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async cloneDashboard(id: number, newName: string): Promise<DashboardLayout> {
    const response = await axios.post(`${API_BASE_URL}/dashboards/${id}/clone`, null, {
      params: { newName },
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }

  getDateRangeOptions(): Array<{ value: string; label: string }> {
    return [
      { value: '7', label: 'Last 7 days' },
      { value: '30', label: 'Last 30 days' },
      { value: '90', label: 'Last 90 days' },
      { value: '180', label: 'Last 6 months' },
      { value: '365', label: 'Last year' }
    ];
  }

  getChartColors(): string[] {
    return [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6B7280'
    ];
  }

  generateChartConfig(type: string, data: any): any {
    const colors = this.getChartColors();
    
    switch (type) {
      case 'bar':
        return {
          type: 'bar',
          data: {
            labels: data.labels || [],
            datasets: [{
              data: data.values || [],
              backgroundColor: colors[0],
              borderColor: colors[0],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            }
          }
        };
      
      case 'line':
        return {
          type: 'line',
          data: {
            labels: data.labels || [],
            datasets: [{
              data: data.values || [],
              borderColor: colors[0],
              backgroundColor: colors[0] + '20',
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            }
          }
        };
      
      case 'pie':
        return {
          type: 'pie',
          data: {
            labels: data.labels || [],
            datasets: [{
              data: data.values || [],
              backgroundColor: colors
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false
          }
        };
      
      default:
        return {};
    }
  }
}

export const analyticsApi = new AnalyticsApi();