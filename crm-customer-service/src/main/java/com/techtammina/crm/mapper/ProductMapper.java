package com.techtammina.crm.mapper;

import com.techtammina.crm.dto.ProductDTO;
import com.techtammina.crm.entity.Product;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class ProductMapper {

    public ProductDTO toDTO(Product product) {
        if (product == null) return null;
        
        ProductDTO dto = new ProductDTO();
        dto.setProductId(product.getProductId());
        dto.setProductName(product.getProductName());
        dto.setProductCode(product.getProductCode());
        dto.setDescription(product.getDescription());
        dto.setCategory(product.getCategory());
        dto.setUnitPrice(product.getUnitPrice());
        dto.setCostPrice(product.getCostPrice());
        dto.setIsActive(product.getIsActive());
        dto.setCreatedDate(product.getCreatedDate());
        
        return dto;
    }

    public Product toEntity(ProductDTO dto) {
        if (dto == null) return null;
        
        Product product = new Product();
        product.setProductId(dto.getProductId());
        product.setProductName(dto.getProductName());
        product.setProductCode(dto.getProductCode());
        product.setDescription(dto.getDescription());
        product.setCategory(dto.getCategory());
        product.setUnitPrice(dto.getUnitPrice());
        product.setCostPrice(dto.getCostPrice());
        product.setIsActive(dto.getIsActive());
        
        return product;
    }

    public List<ProductDTO> toDTOList(List<Product> products) {
        return products.stream().map(this::toDTO).collect(Collectors.toList());
    }
}

