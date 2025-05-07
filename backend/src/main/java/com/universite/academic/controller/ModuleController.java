package com.universite.academic.controller;

import com.universite.academic.dto.ModuleDto;
import com.universite.academic.service.ModuleService;
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
public class ModuleController {

    private final ModuleService moduleService;

    @GetMapping("/modules")
    public ResponseEntity<List<ModuleDto>> getAllModules() {
        List<ModuleDto> modules = moduleService.getAllModules();
        return ResponseEntity.ok(modules);
    }

    @GetMapping("/modules/{id}")
    public ResponseEntity<ModuleDto> getModuleById(@PathVariable Long id) {
        ModuleDto module = moduleService.getModuleById(id);
        return ResponseEntity.ok(module);
    }

    @GetMapping("/filieres/{filiereId}/modules")
    public ResponseEntity<List<ModuleDto>> getModulesByFiliere(@PathVariable Long filiereId) {
        List<ModuleDto> modules = moduleService.getModulesByFiliere(filiereId);
        return ResponseEntity.ok(modules);
    }

    @GetMapping("/filieres/{filiereId}/semestres/{semestre}/modules")
    public ResponseEntity<List<ModuleDto>> getModulesByFiliereAndSemestre(
            @PathVariable Long filiereId,
            @PathVariable Integer semestre) {
        List<ModuleDto> modules = moduleService.getModulesByFiliereAndSemestre(filiereId, semestre);
        return ResponseEntity.ok(modules);
    }

    @GetMapping("/professor/modules")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<List<ModuleDto>> getMyModules(@AuthenticationPrincipal User currentUser) {
        List<ModuleDto> modules = moduleService.getModulesByProfesseur(currentUser.getId());
        return ResponseEntity.ok(modules);
    }

    @PostMapping("/admin/modules")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ModuleDto> createModule(@RequestBody ModuleDto moduleDto) {
        ModuleDto createdModule = moduleService.createModule(moduleDto);
        return new ResponseEntity<>(createdModule, HttpStatus.CREATED);
    }

    @PutMapping("/admin/modules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ModuleDto> updateModule(@PathVariable Long id, @RequestBody ModuleDto moduleDto) {
        ModuleDto updatedModule = moduleService.updateModule(id, moduleDto);
        return ResponseEntity.ok(updatedModule);
    }

    @DeleteMapping("/admin/modules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> deleteModule(@PathVariable Long id) {
        moduleService.deleteModule(id);
        return ResponseEntity.ok(new ApiResponse(true, "Module supprimé avec succès"));
    }
}