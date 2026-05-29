import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { Case, serviceApi } from '../../api/serviceApi';
import CaseList from './components/CaseList';
import CaseDetail from './components/CaseDetail';
import CaseForm from './components/CaseForm';
import ServiceDashboard from './components/ServiceDashboard';

const ServiceModule: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (!showDashboard && !showForm && !selectedCase) {
      loadCases();
    }
  }, [currentPage, showDashboard, showForm, selectedCase]);

  const loadCases = async () => {
    try {
      setLoading(true);
      const response = await serviceApi.getCases(currentPage, 10);
      setCases(response.content);
      setTotalPages(response.totalPages);
    } catch (error) {
      logger.error('Error loading cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = () => {
    setSelectedCase(null);
    setShowForm(true);
    setShowDashboard(false);
  };

  const handleEditCase = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setShowForm(true);
    setShowDashboard(false);
  };

  const handleViewCase = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setShowForm(false);
    setShowDashboard(false);
  };

  const handleSaveCase = async (caseItem: Case) => {
    try {
      if (caseItem.caseId) {
        await serviceApi.updateCase(caseItem.caseId, caseItem);
      } else {
        await serviceApi.createCase(caseItem);
      }
      setShowForm(false);
      setSelectedCase(null);
      setShowDashboard(false);
      loadCases();
    } catch (error) {
      logger.error('Error saving case:', error);
    }
  };

  const handleCaseAction = async (caseId: number, action: string, data?: any) => {
    try {
      switch (action) {
        case 'assign':
          await serviceApi.assignCase(caseId, data.assigneeId);
          break;
        case 'resolve':
          await serviceApi.resolveCase(caseId, data.resolutionDetails, data.resolutionType);
          break;
        case 'close':
          await serviceApi.closeCase(caseId);
          break;
        case 'reopen':
          await serviceApi.reopenCase(caseId);
          break;
        case 'escalate':
          await serviceApi.escalateCase(caseId);
          break;
        case 'comment':
          await serviceApi.addComment(caseId, data);
          break;
      }
      
      if (selectedCase && selectedCase.caseId === caseId) {
        const updatedCase = await serviceApi.getCaseById(caseId);
        setSelectedCase(updatedCase);
      }
      
      if (!showDashboard && !showForm) {
        loadCases();
      }
    } catch (error) {
      logger.error(`Error performing ${action}:`, error);
    }
  };

  const handleBackToList = () => {
    setSelectedCase(null);
    setShowForm(false);
    setShowDashboard(false);
  };

  const handleBackToDashboard = () => {
    setSelectedCase(null);
    setShowForm(false);
    setShowDashboard(true);
  };

  if (loading && !showDashboard && !showForm && !selectedCase) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customer Service</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleBackToDashboard}
            className={`px-4 py-2 rounded-lg transition-colors ${
              showDashboard 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={handleBackToList}
            className={`px-4 py-2 rounded-lg transition-colors ${
              !showDashboard && !showForm && !selectedCase
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Cases
          </button>
          <button
            onClick={handleCreateCase}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Create Case
          </button>
        </div>
      </div>

      {showDashboard ? (
        <ServiceDashboard onViewAllCases={handleBackToList} onCreateCase={handleCreateCase} />
      ) : showForm ? (
        <CaseForm
          case={selectedCase}
          onSave={handleSaveCase}
          onCancel={() => {
            setShowForm(false);
            setSelectedCase(null);
            setShowDashboard(true);
          }}
        />
      ) : selectedCase ? (
        <CaseDetail
          case={selectedCase}
          onEdit={() => handleEditCase(selectedCase)}
          onAction={handleCaseAction}
          onBack={handleBackToList}
        />
      ) : (
        <CaseList
          cases={cases}
          onView={handleViewCase}
          onEdit={handleEditCase}
          onAction={handleCaseAction}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default ServiceModule;
