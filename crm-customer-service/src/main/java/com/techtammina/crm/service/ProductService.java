package com.techtammina.crm.service;

import com.techtammina.crm.dto.ProductDTO;
import com.techtammina.crm.entity.Product;
import com.techtammina.crm.mapper.ProductMapper;
import com.techtammina.crm.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    public ProductService(ProductRepository productRepository, ProductMapper productMapper) {
        this.productRepository = productRepository;
        this.productMapper = productMapper;
    }

    public ProductDTO createProduct(ProductDTO productDTO) {
        Product product = productMapper.toEntity(productDTO);
        product = productRepository.save(product);
        return productMapper.toDTO(product);
    }

    public List<ProductDTO> getAllProducts() {
        List<Product> products = productRepository.findByIsActiveTrue();
        return productMapper.toDTOList(products);
    }

    public Optional<ProductDTO> getProductById(Integer productId) {
        return productRepository.findById(productId)
            .map(productMapper::toDTO);
    }

    public ProductDTO updateProduct(Integer productId, ProductDTO productDTO) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found"));
        
        product.setProductName(productDTO.getProductName());
        product.setProductCode(productDTO.getProductCode());
        product.setDescription(productDTO.getDescription());
        product.setCategory(productDTO.getCategory());
        product.setUnitPrice(productDTO.getUnitPrice());
        product.setCostPrice(productDTO.getCostPrice());
        product.setIsActive(productDTO.getIsActive());
        
        product = productRepository.save(product);
        return productMapper.toDTO(product);
    }

    public void deleteProduct(Integer productId) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found"));
        
        product.setIsActive(false); // Soft delete
        productRepository.save(product);
    }

    public List<ProductDTO> searchProducts(String keyword) {
        List<Product> products = productRepository.searchProducts(keyword);
        return productMapper.toDTOList(products);
    }

    public List<ProductDTO> getProductsByCategory(String category) {
        List<Product> products = productRepository.findByCategory(category);
        return productMapper.toDTOList(products);
    }

    public List<String> getCategories() {
        return productRepository.findDistinctCategories();
    }
}

