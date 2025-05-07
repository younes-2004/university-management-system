package com.universite.admin.controller;

import com.universite.admin.service.ExcelImportService;
import com.universite.auth.dto.ApiResponse;
import com.universite.auth.dto.UserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ImportController {

    private final ExcelImportService excelImportService;

    @PostMapping("/filieres/{filiereId}/students/import")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> importStudents
(
            @PathVariable Long filiereId,
            @RequestParam("file") MultipartFile file) {

        List<UserDto> importedStudents = excelImportService.importStudentsFromExcel(file, filiereId);

        return ResponseEntity.ok(new ApiResponse(
                true,
                importedStudents.size() + " étudiants importés avec succès"
        ));
    }
}