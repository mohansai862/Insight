package com.techtammina.crm.service;

import com.techtammina.crm.dto.PriceListDTO;
import com.techtammina.crm.dto.PriceListItemDTO;
import com.techtammina.crm.entity.PriceList;
import com.techtammina.crm.entity.PriceListItem;
import com.techtammina.crm.entity.Product;
import com.techtammina.crm.repository.PriceListRepository;
import com.techtammina.crm.repository.PriceListItemRepository;
import com.techtammina.crm.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class PriceListService {

    private final PriceListRepository priceListRepository;
    private final PriceListItemRepository priceListItemRepository;
    private final ProductRepository productRepository;

    public PriceListService(PriceListRepository priceListRepository, 
                           PriceListItemRepository priceListItemRepository,
                           ProductRepository productRepository) {
        this.priceListRepository = priceListRepository;
        this.priceListItemRepository = priceListItemRepository;
        this.productRepository = productRepository;
    }

    public PriceListDTO createPriceList(PriceListDTO priceListDTO) {
        PriceList priceList = new PriceList();
        priceList.setPriceListName(priceListDTO.getPriceListName());
        priceList.setCurrency(priceListDTO.getCurrency());
        priceList.setIsDefault(priceListDTO.getIsDefault());
        priceList.setEffectiveDate(priceListDTO.getEffectiveDate());
        priceList.setExpirationDate(priceListDTO.getExpirationDate());
        
        priceList = priceListRepository.save(priceList);
        return convertToDTO(priceList);
    }

    public Page<PriceListDTO> getAllPriceLists(Pageable pageable) {
        Page<PriceList> priceLists = priceListRepository.findAll(pageable);
        return priceLists.map(this::convertToDTO);
    }

    public Optional<PriceListDTO> getPriceListById(Integer id) {
        return priceListRepository.findById(id).map(this::convertToDTO);
    }

    public PriceListDTO updatePriceList(Integer id, PriceListDTO priceListDTO) {
        PriceList priceList = priceListRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("PriceList not found"));
        
        priceList.setPriceListName(priceListDTO.getPriceListName());
        priceList.setCurrency(priceListDTO.getCurrency());
        priceList.setIsDefault(priceListDTO.getIsDefault());
        priceList.setEffectiveDate(priceListDTO.getEffectiveDate());
        priceList.setExpirationDate(priceListDTO.getExpirationDate());
        
        priceList = priceListRepository.save(priceList);
        return convertToDTO(priceList);
    }

    public void deletePriceList(Integer id) {
        priceListRepository.deleteById(id);
    }

    public List<PriceListItemDTO> getPriceListItems(Integer priceListId) {
        List<PriceListItem> items = priceListItemRepository.findByPriceListPriceListId(priceListId);
        return items.stream().map(this::convertItemToDTO).collect(Collectors.toList());
    }

    public PriceListItemDTO addProductToPriceList(Integer priceListId, PriceListItemDTO itemDTO) {
        PriceList priceList = priceListRepository.findById(priceListId)
            .orElseThrow(() -> new RuntimeException("PriceList not found"));
        
        Product product = productRepository.findById(itemDTO.getProductId())
            .orElseThrow(() -> new RuntimeException("Product not found"));
        
        PriceListItem item = new PriceListItem();
        item.setPriceList(priceList);
        item.setProduct(product);
        item.setUnitPrice(itemDTO.getUnitPrice());
        item.setMinQuantity(itemDTO.getMinQuantity());
        
        item = priceListItemRepository.save(item);
        return convertItemToDTO(item);
    }

    public Optional<PriceListDTO> getDefaultPriceList() {
        return priceListRepository.findByIsDefaultTrue().map(this::convertToDTO);
    }

    private PriceListDTO convertToDTO(PriceList priceList) {
        PriceListDTO dto = new PriceListDTO();
        dto.setPriceListId(priceList.getPriceListId());
        dto.setPriceListName(priceList.getPriceListName());
        dto.setCurrency(priceList.getCurrency());
        dto.setIsDefault(priceList.getIsDefault());
        dto.setEffectiveDate(priceList.getEffectiveDate());
        dto.setExpirationDate(priceList.getExpirationDate());
        dto.setCreatedDate(priceList.getCreatedDate());
        return dto;
    }

    private PriceListItemDTO convertItemToDTO(PriceListItem item) {
        PriceListItemDTO dto = new PriceListItemDTO();
        dto.setPriceListItemId(item.getPriceListItemId());
        dto.setPriceListId(item.getPriceList().getPriceListId());
        dto.setProductId(item.getProduct().getProductId());
        dto.setProductName(item.getProduct().getProductName());
        dto.setProductCode(item.getProduct().getProductCode());
        dto.setUnitPrice(item.getUnitPrice());
        dto.setMinQuantity(item.getMinQuantity());
        return dto;
    }
}

