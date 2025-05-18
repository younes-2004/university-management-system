package com.universite.admin.controller;

import com.universite.auth.dto.ApiResponse;
import com.universite.auth.dto.UserDto;
import com.universite.auth.entity.enums.StudentStatus;
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
        try {
            List<UserDto> students = userService.getUsersByRole(UserRole.STUDENT);
            System.out.println("Récupération de " + students.size() + " étudiants");
            return ResponseEntity.ok(students);
        } catch (Exception e) {
            System.err.println("Erreur lors de la récupération des étudiants: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/students/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> getStudentById(@PathVariable Long id) {
        try {
            UserDto student = userService.getUserById(id);

            // Vérifier que c'est bien un étudiant
            if (student.getRole() != UserRole.STUDENT) {
                return ResponseEntity.notFound().build();
            }

            System.out.println("Récupération de l'étudiant: " + student.getNom() + " " + student.getPrenom());
            return ResponseEntity.ok(student);
        } catch (Exception e) {
            System.err.println("Erreur lors de la récupération de l'étudiant ID " + id + ": " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/filieres/{filiereId}/students")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getStudentsByFiliere(@PathVariable Long filiereId) {
        try {
            List<UserDto> students = userService.getStudentsByFiliere(filiereId);
            System.out.println("Récupération de " + students.size() + " étudiants pour la filière " + filiereId);
            return ResponseEntity.ok(students);
        } catch (Exception e) {
            System.err.println("Erreur lors de la récupération des étudiants pour la filière " + filiereId + ": " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    // Dans StudentAdminController.java - Remplacer la méthode createStudent
    @PostMapping("/students")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> createStudent(@RequestBody UserDto studentDto, @RequestParam String password) {
        try {
            System.out.println("=== RÉCEPTION REQUÊTE POST /students ===");
            System.out.println("Mot de passe reçu: " + (password != null ? "***" : "null"));

            // Débugger l'objet reçu
            System.out.println("Objet StudentDto reçu:");
            System.out.println("- toString(): " + studentDto.toString());
            System.out.println("- nom: '" + studentDto.getNom() + "'");
            System.out.println("- prenom: '" + studentDto.getPrenom() + "'");
            System.out.println("- email: '" + studentDto.getEmail() + "'");
            System.out.println("- nApogee (getter): '" + studentDto.getNApogee() + "'");
            System.out.println("- role: " + studentDto.getRole());
            System.out.println("- filiereId: " + studentDto.getFiliereId());
            System.out.println("- statut: " + studentDto.getStatut());
            System.out.println("- annee: " + studentDto.getAnnee());
            System.out.println("- dateNaissance: " + studentDto.getDateNaissance());

            // S'assurer que le rôle est défini sur STUDENT
            studentDto.setRole(UserRole.STUDENT);

            // Définir un statut par défaut si non fourni
            if (studentDto.getStatut() == null) {
                studentDto.setStatut(StudentStatus.ACTIF);
                System.out.println("Statut défini par défaut: ACTIF");
            }

            // Validation des champs obligatoires pour un étudiant
            if (studentDto.getNApogee() == null || studentDto.getNApogee().trim().isEmpty()) {
                System.err.println("ERREUR: nApogee manquant ou vide");
                System.err.println("nApogee reçu dans validation: '" + studentDto.getNApogee() + "'");

                // Retourner une réponse d'erreur avec un message
                return ResponseEntity.badRequest()
                        .header("Content-Type", "application/json")
                        .body(null);
            }

            if (studentDto.getFiliereId() == null) {
                System.err.println("ERREUR: filiereId manquant");
                return ResponseEntity.badRequest().build();
            }

            System.out.println("Validation réussie, appel du service...");
            UserDto createdStudent = userService.createUser(studentDto, password);
            System.out.println("Étudiant créé avec succès - ID: " + createdStudent.getId());
            System.out.println("=== FIN CRÉATION ===");

            return new ResponseEntity<>(createdStudent, HttpStatus.CREATED);
        } catch (Exception e) {
            System.err.println("Erreur lors de la création de l'étudiant: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @PutMapping("/students/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> updateStudent(@PathVariable Long id, @RequestBody UserDto studentDto) {
        try {
            System.out.println("=== RÉCEPTION REQUÊTE PUT /students/" + id + " ===");
            System.out.println("Données JSON reçues:");
            System.out.println("- nom: " + studentDto.getNom());
            System.out.println("- prenom: " + studentDto.getPrenom());
            System.out.println("- email: " + studentDto.getEmail());
            System.out.println("- nApogee: '" + studentDto.getNApogee() + "'");
            System.out.println("- filiereId: " + studentDto.getFiliereId());
            System.out.println("- statut: " + studentDto.getStatut());
            System.out.println("- annee: " + studentDto.getAnnee());
            System.out.println("- role: " + studentDto.getRole());

            // S'assurer que le rôle est défini sur STUDENT
            studentDto.setRole(UserRole.STUDENT);

            // Validation des champs obligatoires pour un étudiant
            if (studentDto.getNApogee() == null || studentDto.getNApogee().trim().isEmpty()) {
                System.err.println("ERREUR: nApogee manquant ou vide");
                System.err.println("nApogee reçu: '" + studentDto.getNApogee() + "'");
                return ResponseEntity.badRequest().build();
            }

            if (studentDto.getFiliereId() == null) {
                System.err.println("ERREUR: filiereId manquant");
                return ResponseEntity.badRequest().build();
            }

            UserDto updatedStudent = userService.updateUser(id, studentDto);

            System.out.println("=== RÉPONSE CONTRÔLEUR ===");
            System.out.println("Étudiant retourné:");
            System.out.println("- ID: " + updatedStudent.getId());
            System.out.println("- nom: " + updatedStudent.getNom());
            System.out.println("- prenom: " + updatedStudent.getPrenom());
            System.out.println("- email: " + updatedStudent.getEmail());
            System.out.println("- nApogee: '" + updatedStudent.getNApogee() + "'");
            System.out.println("- filiereId: " + updatedStudent.getFiliereId());
            System.out.println("- statut: " + updatedStudent.getStatut());
            System.out.println("- annee: " + updatedStudent.getAnnee());
            System.out.println("=== FIN TRAITEMENT CONTRÔLEUR ===");

            return ResponseEntity.ok(updatedStudent);
        } catch (Exception e) {
            System.err.println("Erreur lors de la modification de l'étudiant: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @DeleteMapping("/students/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> deleteStudent(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            System.out.println("Étudiant supprimé avec succès - ID: " + id);
            return ResponseEntity.ok(new ApiResponse(true, "Étudiant supprimé avec succès"));
        } catch (Exception e) {
            System.err.println("Erreur lors de la suppression de l'étudiant: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}