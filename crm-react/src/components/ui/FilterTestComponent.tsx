/**
 * Filter Test Component
 * Simple component to test filter clearing functionality
 */

import React from 'react';
import { useFilterManager } from '@/utils/filterManager';
import Button from './Button';

const FilterTestComponent: React.FC = () => {
  const { clearAllFilters, clearModuleFilters, handleNavigation } = useFilterManager();
  
  const testFilters = () => {
    // Set some test filters
    localStorage.setItem('accountsFilters', JSON.stringify({
      searchQuery: 'test',
      selectedIndustry: 'Technology',
      appliedFromDate: '2024-01-01',
      appliedToDate: '2024-12-31',
      viewMode: 'table'
    }));
    
    localStorage.setItem('leadsFilters', JSON.stringify({
      searchQuery: 'test lead',
      statusFilter: 'qualified',
      sourceFilter: 'website'
    }));
    
    console.log('Test filters set');
  };
  
  const checkFilters = () => {
    console.log('Current filters:');
    console.log('Accounts:', localStorage.getItem('accountsFilters'));
    console.log('Leads:', localStorage.getItem('leadsFilters'));
  };
  
  const simulateNavigation = () => {
    // Simulate navigation from accounts to leads
    handleNavigation('/crm/leads', '/crm/accounts');
    console.log('Simulated navigation from accounts to leads');
  };
  
  const simulateLogout = () => {
    clearAllFilters();
    console.log('Simulated logout - all filters cleared');
  };
  
  return (
    <div className="p-4 border border-gray-200 rounded-lg space-y-2">
      <h3 className="font-medium">Filter Manager Test</h3>
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={testFilters}>
          Set Test Filters
        </Button>
        <Button size="sm" variant="outline" onClick={checkFilters}>
          Check Filters
        </Button>
        <Button size="sm" variant="outline" onClick={simulateNavigation}>
          Simulate Navigation
        </Button>
        <Button size="sm" variant="outline" onClick={simulateLogout}>
          Simulate Logout
        </Button>
      </div>
    </div>
  );
};

export default FilterTestComponent;