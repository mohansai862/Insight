import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { Product, quotesApi } from '../../api/quotesApi';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';

const ProductsModule: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsData = await quotesApi.getProducts();
      setProducts(productsData);
    } catch (error) {
      logger.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowForm(true);
  };

  const handleSaveProduct = async (product: Product) => {
    try {
      if (product.productId) {
        await quotesApi.updateProduct(product.productId, product);
      } else {
        await quotesApi.createProduct(product);
      }
      setShowForm(false);
      setSelectedProduct(null);
      loadProducts();
    } catch (error) {
      logger.error('Error saving product:', error);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await quotesApi.deleteProduct(productId);
        loadProducts();
      } catch (error) {
        logger.error('Error deleting product:', error);
      }
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
        <h1 className="text-2xl font-bold text-gray-900">Products Management</h1>
        <button
          onClick={handleCreateProduct}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Product
        </button>
      </div>

      {showForm ? (
        <ProductForm
          product={selectedProduct}
          onSave={handleSaveProduct}
          onCancel={() => {
            setShowForm(false);
            setSelectedProduct(null);
          }}
        />
      ) : (
        <ProductList
          products={products}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
        />
      )}
    </div>
  );
};

export default ProductsModule;
