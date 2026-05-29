import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { quotesApi, Quote } from '../../api/quotesApi';
import QuoteList from './components/QuoteList';
import QuoteForm from './components/QuoteForm';
import QuoteDetail from './components/QuoteDetail';

const QuotesModule: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadQuotes();
  }, [currentPage]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const response = await quotesApi.getQuotes(currentPage, 10);
      setQuotes(response.content);
      setTotalPages(response.totalPages);
    } catch (error) {
      logger.error('Error loading quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuote = () => {
    setSelectedQuote(null);
    setShowForm(true);
  };

  const handleEditQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowForm(true);
  };

  const handleViewQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowForm(false);
  };

  const handleSaveQuote = async (quote: Quote) => {
    try {
      if (quote.quoteId) {
        await quotesApi.updateQuote(quote.quoteId, quote);
      } else {
        await quotesApi.createQuote(quote);
      }
      setShowForm(false);
      setSelectedQuote(null);
      loadQuotes();
    } catch (error) {
      logger.error('Error saving quote:', error);
    }
  };

  const handleDeleteQuote = async (quoteId: number) => {
    if (window.confirm('Are you sure you want to delete this quote?')) {
      try {
        await quotesApi.deleteQuote(quoteId);
        loadQuotes();
      } catch (error) {
        logger.error('Error deleting quote:', error);
      }
    }
  };

  const handleStatusChange = async (quoteId: number, action: 'send' | 'accept' | 'reject') => {
    try {
      switch (action) {
        case 'send':
          await quotesApi.sendQuote(quoteId);
          break;
        case 'accept':
          await quotesApi.acceptQuote(quoteId);
          break;
        case 'reject':
          await quotesApi.rejectQuote(quoteId);
          break;
      }
      loadQuotes();
    } catch (error) {
      logger.error(`Error ${action}ing quote:`, error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quotes Management</h1>
        <button
          onClick={handleCreateQuote}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Quote
        </button>
      </div>

      {showForm ? (
        <QuoteForm
          quote={selectedQuote}
          onSave={handleSaveQuote}
          onCancel={() => {
            setShowForm(false);
            setSelectedQuote(null);
          }}
        />
      ) : selectedQuote ? (
        <QuoteDetail
          quote={selectedQuote}
          onEdit={() => handleEditQuote(selectedQuote)}
          onDelete={() => handleDeleteQuote(selectedQuote.quoteId!)}
          onStatusChange={(action) => handleStatusChange(selectedQuote.quoteId!, action)}
          onBack={() => setSelectedQuote(null)}
          onRefresh={loadQuotes}
        />
      ) : (
        <QuoteList
          quotes={quotes}
          onView={handleViewQuote}
          onEdit={handleEditQuote}
          onDelete={handleDeleteQuote}
          onStatusChange={handleStatusChange}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default QuotesModule;
