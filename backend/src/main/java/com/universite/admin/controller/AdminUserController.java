package com.universite.admin.controller;

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
public class AdminUserController {

    private final UserService userService;

    @GetMapping("/admins")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getAllAdmins() {
        List<UserDto> admins = userService.getUsersByRole(UserRole.ADMIN);
        return ResponseEntity.ok(admins);
    }

    @GetMapping("/admins/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> getAdminById(@PathVariable Long id) {
        UserDto admin = userService.getUserById(id);
        return ResponseEntity.ok(admin);
    }

    @PostMapping("/admins")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> createAdmin(@RequestBody UserDto adminDto, @RequestParam String password) {
        adminDto.setRole(UserRole.ADMIN);
        UserDto createdAdmin = userService.createUser(adminDto, password);
        return new ResponseEntity<>(createdAdmin, HttpStatus.CREATED);
    }

    @PutMapping("/admins/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> updateAdmin(@PathVariable Long id, @RequestBody UserDto adminDto) {
        adminDto.setRole(UserRole.ADMIN);
        UserDto updatedAdmin = userService.updateUser(id, adminDto);
        return ResponseEntity.ok(updatedAdmin);
    }

    @DeleteMapping("/admins/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> deleteAdmin(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(new ApiResponse(true, "Administrateur supprimé avec succès"));
    }
}