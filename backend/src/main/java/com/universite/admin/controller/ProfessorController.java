package com.universite.admin.controller;

import com.universite.academic.service.ModuleService;
import com.universite.auth.dto.ApiResponse;
import com.universite.auth.dto.UserDto;
import com.universite.auth.entity.enums.UserRole;
import com.universite.auth.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProfessorController {

    private final UserService userService;

    @GetMapping("/professors")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getAllProfessors() {
        List<UserDto> professors = userService.getUsersByRole(UserRole.PROFESSOR);
        return ResponseEntity.ok(professors);
    }

    @GetMapping("/professors/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> getProfessorById(@PathVariable Long id) {
        UserDto professor = userService.getUserById(id);
        return ResponseEntity.ok(professor);
    }

    @PostMapping("/professors")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> createProfessor(@RequestBody UserDto professorDto, @RequestParam String password) {
        professorDto.setRole(UserRole.PROFESSOR);
        UserDto createdProfessor = userService.createUser(professorDto, password);
        return new ResponseEntity<>(createdProfessor, HttpStatus.CREATED);
    }

    @PutMapping("/professors/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> updateProfessor(@PathVariable Long id, @RequestBody UserDto professorDto) {
        professorDto.setRole(UserRole.PROFESSOR);
        UserDto updatedProfessor = userService.updateUser(id, professorDto);
        return ResponseEntity.ok(updatedProfessor);
    }

    @DeleteMapping("/professors/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> deleteProfessor(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(new ApiResponse(true, "Professeur supprimé avec succès"));
    }

    @PutMapping("/professors/{professorId}/modules/{moduleId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> assignModuleToProfessor(@PathVariable Long professorId, @PathVariable Long moduleId) {
        ModuleService moduleService = null;
        moduleService.assignProfessorToModule(moduleId, professorId);
        return ResponseEntity.ok(new ApiResponse(true, "Module assigné au professeur avec succès"));
    }
}