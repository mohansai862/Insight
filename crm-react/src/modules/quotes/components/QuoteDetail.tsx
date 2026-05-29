import { logger } from '@/utils/logger';
import React from 'react';
import { Quote, quotesApi } from '../../../api/quotesApi';

interface QuoteDetailProps {
  quote: Quote;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (action: 'send' | 'accept' | 'reject') => void;
  onBack: () => void;
  onRefresh?: () => void;
}

const QuoteDetail: React.FC<QuoteDetailProps> = ({
  quote,
  onEdit,
  onDelete,
  onStatusChange,
  onBack,
  onRefresh
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Sent': return 'bg-blue-100 text-blue-800';
      case 'Viewed': return 'bg-yellow-100 text-yellow-800';
      case 'Accepted': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Expired': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const pdfBlob = await quotesApi.generateQuotePDF(quote.quoteId!);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quote-${quote.quoteNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Error downloading PDF:', error);
      alert('Error generating PDF');
    }
  };

  const handleDuplicate = async () => {
    try {
      await quotesApi.duplicateQuote(quote.quoteId!);
      alert('Quote duplicated successfully');
      if (onRefresh) onRefresh();
    } catch (error) {
      logger.error('Error duplicating quote:', error);
      alert('Error duplicating quote');
    }
  };

  const handleConvertToDeal = async () => {
    if (quote.status !== 'Accepted') {
      alert('Only accepted quotes can be converted to deals');
      return;
    }
    
    if (window.confirm('Are you sure you want to convert this quote to a deal?')) {
      try {
        const result = await quotesApi.convertQuoteToDeal(quote.quoteId!);
        alert(result);
        if (onRefresh) onRefresh();
      } catch (error) {
        logger.error('Error converting to deal:', error);
        alert('Error converting quote to deal');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-gray-600"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {quote.quoteNumber}
              </h1>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quote.status || 'Draft')}`}>
                {quote.status}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Status Actions */}
            {quote.status === 'Draft' && (
              <button
                onClick={() => onStatusChange('send')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
              >
                Send Quote
              </button>
            )}
            {quote.status === 'Sent' && (
              <>
                <button
                  onClick={() => onStatusChange('accept')}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
                >
                  Accept
                </button>
                <button
                  onClick={() => onStatusChange('reject')}
                  className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 text-sm"
                >
                  Reject
                </button>
              </>
            )}
            
            {/* Convert to Deal */}
            {quote.status === 'Accepted' && (
              <button
                onClick={handleConvertToDeal}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm"
              >
                Convert to Deal
              </button>
            )}
            
            {/* PDF Download */}
            <button
              onClick={handleDownloadPDF}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
            >
              Download PDF
            </button>
            
            {/* Duplicate */}
            <button
              onClick={handleDuplicate}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 text-sm"
            >
              Duplicate
            </button>
            
            {/* Edit */}
            {quote.status === 'Draft' && (
              <button
                onClick={onEdit}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
              >
                Edit
              </button>
            )}
            
            {/* Delete */}
            <button
              onClick={onDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Quote Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quote Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Account</label>
                <p className="text-gray-900">{quote.accountName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Contact</label>
                <p className="text-gray-900">{quote.contactName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Related Deal</label>
                <p className="text-gray-900">{quote.dealName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created By</label>
                <p className="text-gray-900">{quote.createdByName}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dates</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Created Date</label>
                <p className="text-gray-900">
                  {quote.createdDate ? new Date(quote.createdDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Valid Until</label>
                <p className="text-gray-900">
                  {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Expiration Date</label>
                <p className="text-gray-900">
                  {quote.expirationDate ? new Date(quote.expirationDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Line Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Line Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quote.lineItems?.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.productName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.discount || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(item.lineTotal || (item.quantity * item.unitPrice - (item.discount || 0)))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(quote.totalAmount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium">-{formatCurrency(quote.discount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">{formatCurrency(quote.tax || 0)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="text-lg font-bold">Grand Total:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(quote.grandTotal || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms and Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quote.terms && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Terms & Conditions</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{quote.terms}</p>
              </div>
            </div>
          )}

          {quote.notes && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteDetail;
