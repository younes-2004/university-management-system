package com.universite.academic.controller;

import com.universite.academic.dto.FiliereDto;
import com.universite.academic.service.FiliereService;
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
public class FiliereController {

    private final FiliereService filiereService;

    @GetMapping("/filieres")
    public ResponseEntity<List<FiliereDto>> getAllFilieres() {
        List<FiliereDto> filieres = filiereService.getAllFilieres();
        return ResponseEntity.ok(filieres);
    }

    @GetMapping("/filieres/{id}")
    public ResponseEntity<FiliereDto> getFiliereById(@PathVariable Long id) {
        FiliereDto filiere = filiereService.getFiliereById(id);
        return ResponseEntity.ok(filiere);
    }

    @PostMapping("/admin/filieres")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FiliereDto> createFiliere(@RequestBody FiliereDto filiereDto) {
        FiliereDto createdFiliere = filiereService.createFiliere(filiereDto);
        return new ResponseEntity<>(createdFiliere, HttpStatus.CREATED);
    }

    @PutMapping("/admin/filieres/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FiliereDto> updateFiliere(@PathVariable Long id, @RequestBody FiliereDto filiereDto) {
        FiliereDto updatedFiliere = filiereService.updateFiliere(id, filiereDto);
        return ResponseEntity.ok(updatedFiliere);
    }

    @DeleteMapping("/admin/filieres/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> deleteFiliere(@PathVariable Long id) {
        filiereService.deleteFiliere(id);
        return ResponseEntity.ok(new ApiResponse(true, "Filière supprimée avec succès"));
    }

    @GetMapping("/professor/filieres")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<List<FiliereDto>> getMyFilieres(@AuthenticationPrincipal User currentUser) {
        List<FiliereDto> filieres = filiereService.getFilieresByProfesseur(currentUser.getId());
        return ResponseEntity.ok(filieres);
    }
}