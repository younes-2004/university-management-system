package com.universite.academic.controller;

import com.universite.academic.dto.ElementDto;
import com.universite.academic.service.ElementService;
import com.universite.auth.dto.ApiResponse;
import com.universite.auth.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ElementController {

    private final ElementService elementService;

    @GetMapping("/elements")
    public ResponseEntity<List<ElementDto>> getAllElements() {
        List<ElementDto> elements = elementService.getAllElements();
        return ResponseEntity.ok(elements);
    }

    @GetMapping("/elements/{id}")
    public ResponseEntity<ElementDto> getElementById(@PathVariable Long id) {
        ElementDto element = elementService.getElementById(id);
        return ResponseEntity.ok(element);
    }

    @GetMapping("/modules/{moduleId}/elements")
    public ResponseEntity<List<ElementDto>> getElementsByModule(@PathVariable Long moduleId) {
        List<ElementDto> elements = elementService.getElementsByModule(moduleId);
        return ResponseEntity.ok(elements);
    }

    @GetMapping("/professor/elements")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<List<ElementDto>> getMyElements(@AuthenticationPrincipal User currentUser) {
        List<ElementDto> elements = elementService.getElementsByProfesseur(currentUser.getId());
        return ResponseEntity.ok(elements);
    }

    @PostMapping("/admin/elements")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ElementDto> createElement(@RequestBody ElementDto elementDto) {
        ElementDto createdElement = elementService.createElement(elementDto);
        return new ResponseEntity<>(createdElement, HttpStatus.CREATED);
    }

    @PutMapping("/admin/elements/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ElementDto> updateElement(@PathVariable Long id, @RequestBody ElementDto elementDto) {
        ElementDto updatedElement = elementService.updateElement(id, elementDto);
        return ResponseEntity.ok(updatedElement);
    }

    @DeleteMapping("/admin/elements/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> deleteElement(@PathVariable Long id) {
        elementService.deleteElement(id);
        return ResponseEntity.ok(new ApiResponse(true, "Element supprimé avec succès"));
    }
}