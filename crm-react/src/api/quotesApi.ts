import axios from 'axios';

const API_BASE_URL = '/api';

export interface Quote {
  quoteId?: number;
  quoteNumber?: string;
  dealId?: number;
  dealName?: string;
  accountId: number;
  accountName?: string;
  contactId?: number;
  contactName?: string;
  createdById?: number;
  createdByName?: string;
  createdDate?: string;
  expirationDate?: string;
  status?: 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected' | 'Expired';
  totalAmount?: number;
  discount?: number;
  tax?: number;
  grandTotal?: number;
  terms?: string;
  notes?: string;
  validUntil?: string;
  lineItems?: QuoteLineItem[];
}

export interface QuoteLineItem {
  lineItemId?: number;
  quoteId?: number;
  productId?: number;
  productName?: string;
  productCode?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  lineTotal?: number;
  sortOrder?: number;
}

export interface Product {
  productId?: number;
  productName: string;
  productCode: string;
  description?: string;
  category?: string;
  unitPrice: number;
  costPrice?: number;
  isActive?: boolean;
  createdDate?: string;
}

export interface PriceList {
  priceListId?: number;
  priceListName: string;
  currency?: string;
  isDefault?: boolean;
  effectiveDate?: string;
  expirationDate?: string;
  createdDate?: string;
  priceListItems?: PriceListItem[];
}

export interface PriceListItem {
  priceListItemId?: number;
  priceListId?: number;
  productId: number;
  productName?: string;
  productCode?: string;
  unitPrice: number;
  minQuantity?: number;
}

class QuotesApi {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    const session = localStorage.getItem('tech_tammina_session');
    let userId = '1';
    let userRole = 'Sales_Manager';
    
    if (session) {
      try {
        const user = JSON.parse(session);
        userId = user.id || '1';
        userRole = user.role || 'Sales_Manager';
      } catch {}
    }
    
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
      'X-User-Id': userId,
      'X-User-Role': userRole
    };
  }

  async createQuote(quote: Quote): Promise<Quote> {
    const response = await axios.post(`${API_BASE_URL}/quotes`, quote, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getQuotes(page = 0, size = 10, sortBy = 'createdDate', sortDir = 'desc'): Promise<{
    content: Quote[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }> {
    const response = await axios.get(`${API_BASE_URL}/quotes`, {
      params: { page, size, sortBy, sortDir },
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getQuoteById(id: number): Promise<Quote> {
    const response = await axios.get(`${API_BASE_URL}/quotes/${id}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async updateQuote(id: number, quote: Quote): Promise<Quote> {
    const response = await axios.put(`${API_BASE_URL}/quotes/${id}`, quote, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async deleteQuote(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/quotes/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  async sendQuote(id: number): Promise<Quote> {
    const response = await axios.post(`${API_BASE_URL}/quotes/${id}/send`, {}, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async acceptQuote(id: number): Promise<Quote> {
    const response = await axios.post(`${API_BASE_URL}/quotes/${id}/accept`, {}, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async rejectQuote(id: number): Promise<Quote> {
    const response = await axios.post(`${API_BASE_URL}/quotes/${id}/reject`, {}, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getQuotesByDeal(dealId: number): Promise<Quote[]> {
    const response = await axios.get(`${API_BASE_URL}/quotes/deal/${dealId}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  // Products API
  async getProducts(): Promise<Product[]> {
    const response = await axios.get(`${API_BASE_URL}/products`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async searchProducts(keyword: string): Promise<Product[]> {
    const response = await axios.get(`${API_BASE_URL}/products/search`, {
      params: { keyword },
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    const response = await axios.get(`${API_BASE_URL}/products/category/${category}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getCategories(): Promise<string[]> {
    const response = await axios.get(`${API_BASE_URL}/products/categories`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async createProduct(product: Product): Promise<Product> {
    const response = await axios.post(`${API_BASE_URL}/products`, product, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async updateProduct(id: number, product: Product): Promise<Product> {
    const response = await axios.put(`${API_BASE_URL}/products/${id}`, product, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async deleteProduct(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/products/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // New Quote endpoints
  async convertQuoteToDeal(id: number): Promise<string> {
    const response = await axios.post(`${API_BASE_URL}/quotes/${id}/convert-to-deal`, {}, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async generateQuotePDF(id: number): Promise<Blob> {
    const response = await axios.get(`${API_BASE_URL}/quotes/${id}/pdf`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
    return response.data;
  }

  async duplicateQuote(id: number): Promise<Quote> {
    const response = await axios.post(`${API_BASE_URL}/quotes/${id}/duplicate`, {}, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  // Price Lists API
  async getPriceLists(): Promise<PriceList[]> {
    const response = await axios.get(`${API_BASE_URL}/pricelists`, {
      headers: this.getAuthHeaders()
    });
    return response.data.content;
  }

  async getDefaultPriceList(): Promise<PriceList> {
    const response = await axios.get(`${API_BASE_URL}/pricelists/default`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getPriceListItems(priceListId: number): Promise<PriceListItem[]> {
    const response = await axios.get(`${API_BASE_URL}/pricelists/${priceListId}/items`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }
}

export const quotesApi = new QuotesApi();