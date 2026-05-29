package com.techtammina.crm.controller;

import com.techtammina.crm.dto.PriceListDTO;
import com.techtammina.crm.dto.PriceListItemDTO;
import com.techtammina.crm.service.PriceListService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pricelists")
public class PriceListController {

    private final PriceListService priceListService;

    public PriceListController(PriceListService priceListService) {
        this.priceListService = priceListService;
    }

    @PostMapping
    public ResponseEntity<PriceListDTO> createPriceList(@RequestBody PriceListDTO priceListDTO) {
        PriceListDTO result = priceListService.createPriceList(priceListDTO);
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<Page<PriceListDTO>> getAllPriceLists(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "priceListName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<PriceListDTO> priceLists = priceListService.getAllPriceLists(pageable);
        return ResponseEntity.ok(priceLists);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PriceListDTO> getPriceListById(@PathVariable Integer id) {
        return priceListService.getPriceListById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<PriceListDTO> updatePriceList(@PathVariable Integer id, @RequestBody PriceListDTO priceListDTO) {
        PriceListDTO result = priceListService.updatePriceList(id, priceListDTO);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePriceList(@PathVariable Integer id) {
        priceListService.deletePriceList(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/items")
    public ResponseEntity<List<PriceListItemDTO>> getPriceListItems(@PathVariable Integer id) {
        List<PriceListItemDTO> items = priceListService.getPriceListItems(id);
        return ResponseEntity.ok(items);
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<PriceListItemDTO> addProductToPriceList(@PathVariable Integer id, @RequestBody PriceListItemDTO itemDTO) {
        PriceListItemDTO result = priceListService.addProductToPriceList(id, itemDTO);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/default")
    public ResponseEntity<PriceListDTO> getDefaultPriceList() {
        return priceListService.getDefaultPriceList()
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}

