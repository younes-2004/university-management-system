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
public class StudentAdminController {

    private final UserService userService;

    @GetMapping("/students")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getAllStudents() {
        List<UserDto> students = userService.getUsersByRole(UserRole.STUDENT);
        return ResponseEntity.ok(students);
    }

    @GetMapping("/students/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> getStudentById(@PathVariable Long id) {
        UserDto student = userService.getUserById(id);
        return ResponseEntity.ok(student);
    }

    @GetMapping("/filieres/{filiereId}/students")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getStudentsByFiliere(@PathVariable Long filiereId) {
        List<UserDto> students = userService.getStudentsByFiliere(filiereId);
        return ResponseEntity.ok(students);
    }

    @PostMapping("/students")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> createStudent(@RequestBody UserDto studentDto, @RequestParam String password) {
        studentDto.setRole(UserRole.STUDENT);
        UserDto createdStudent = userService.createUser(studentDto, password);
        return new ResponseEntity<>(createdStudent, HttpStatus.CREATED);
    }

    @PutMapping("/students/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> updateStudent(@PathVariable Long id, @RequestBody UserDto studentDto) {
        UserDto updatedStudent = userService.updateUser(id, studentDto);
        return ResponseEntity.ok(updatedStudent);
    }

    @DeleteMapping("/students/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> deleteStudent(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(new ApiResponse(true, "Étudiant supprimé avec succès"));
    }
}