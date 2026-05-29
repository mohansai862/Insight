import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { Quote, QuoteLineItem, Product, quotesApi } from '../../../api/quotesApi';
import { companiesApi } from '../../../api/companiesApi';
import { contactsApi } from '../../../api/contactsApi';
import { dealsApi } from '../../../api/dealsApi';

interface QuoteFormProps {
  quote: Quote | null;
  onSave: (quote: Quote) => void;
  onCancel: () => void;
}

const QuoteForm: React.FC<QuoteFormProps> = ({ quote, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Quote>({
    accountId: 0,
    lineItems: []
  });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (quote) {
      setFormData(quote);
    }
  }, [quote]);

  const loadData = async () => {
    try {
      const [accountsResponse, productsData, dealsResponse] = await Promise.all([
        companiesApi.list(),
        quotesApi.getProducts(),
        dealsApi.list()
      ]);
      
      setAccounts(accountsResponse.data);
      setProducts(productsData);
      setDeals(dealsResponse.data);
    } catch (error) {
      logger.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async (accountId: number) => {
    try {
      const contactsData = await contactsApi.getContacts();
      setContacts(contactsData.filter((c: any) => c.accountId === accountId));
    } catch (error) {
      logger.error('Error loading contacts:', error);
    }
  };

  const handleInputChange = (field: keyof Quote, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'accountId' && value) {
      loadContacts(value);
    }
  };

  const addLineItem = () => {
    const newLineItem: QuoteLineItem = {
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      sortOrder: (formData.lineItems?.length || 0) + 1
    };

    setFormData(prev => ({
      ...prev,
      lineItems: [...(prev.lineItems || []), newLineItem]
    }));
  };

  const updateLineItem = (index: number, field: keyof QuoteLineItem, value: any) => {
    const updatedLineItems = [...(formData.lineItems || [])];
    updatedLineItems[index] = {
      ...updatedLineItems[index],
      [field]: value
    };

    // If product is selected, auto-fill description and unit price
    if (field === 'productId' && value) {
      const product = products.find(p => p.productId === value);
      if (product) {
        updatedLineItems[index].description = product.description || product.productName;
        updatedLineItems[index].unitPrice = product.unitPrice;
      }
    }

    setFormData(prev => ({
      ...prev,
      lineItems: updatedLineItems
    }));
  };

  const removeLineItem = (index: number) => {
    const updatedLineItems = [...(formData.lineItems || [])];
    updatedLineItems.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      lineItems: updatedLineItems
    }));
  };

  const calculateTotals = () => {
    const lineItems = formData.lineItems || [];
    const totalAmount = lineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice - (item.discount || 0));
    }, 0);

    const discount = formData.discount || 0;
    const tax = formData.tax || 0;
    const grandTotal = totalAmount - discount + tax;

    return { totalAmount, grandTotal };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { totalAmount, grandTotal } = calculateTotals();
    
    onSave({
      ...formData,
      totalAmount,
      grandTotal
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { totalAmount, grandTotal } = calculateTotals();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {quote ? 'Edit Quote' : 'Create New Quote'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account *
            </label>
            <select
              value={formData.accountId}
              onChange={(e) => handleInputChange('accountId', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Account</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact
            </label>
            <select
              value={formData.contactId || ''}
              onChange={(e) => handleInputChange('contactId', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Contact</option>
              {contacts.map(contact => (
                <option key={contact.contactId} value={contact.contactId}>
                  {contact.firstName} {contact.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Related Deal
            </label>
            <select
              value={formData.dealId || ''}
              onChange={(e) => handleInputChange('dealId', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Deal</option>
              {deals.map(deal => (
                <option key={deal.id} value={deal.id}>
                  {deal.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valid Until
            </label>
            <input
              type="date"
              value={formData.validUntil || ''}
              onChange={(e) => handleInputChange('validUntil', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Line Items */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
            <button
              type="button"
              onClick={addLineItem}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Add Item
            </button>
          </div>

          <div className="space-y-3">
            {(formData.lineItems || []).map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Product
                    </label>
                    <select
                      value={item.productId || ''}
                      onChange={(e) => updateLineItem(index, 'productId', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="">Select Product</option>
                      {products.map(product => (
                        <option key={product.productId} value={product.productId}>
                          {product.productName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Unit Price *
                    </label>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Discount
                    </label>
                    <input
                      type="number"
                      value={item.discount || 0}
                      onChange={(e) => updateLineItem(index, 'discount', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount
              </label>
              <input
                type="number"
                value={formData.discount || 0}
                onChange={(e) => handleInputChange('discount', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax
              </label>
              <input
                type="number"
                value={formData.tax || 0}
                onChange={(e) => handleInputChange('tax', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grand Total
              </label>
              <div className="text-lg font-bold text-gray-900 py-2">
                ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* Terms and Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Terms & Conditions
            </label>
            <textarea
              value={formData.terms || ''}
              onChange={(e) => handleInputChange('terms', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
              placeholder="Enter terms and conditions..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
              placeholder="Enter additional notes..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {quote ? 'Update Quote' : 'Create Quote'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuoteForm;
