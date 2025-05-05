package com.universite.auth.dto;

import com.universite.auth.entity.enums.StudentStatus;
import com.universite.auth.entity.enums.StudentYear;
import com.universite.auth.entity.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private LocalDate dateNaissance;
    private UserRole role;

    // Champs spécifiques aux étudiants
    private String nApogee;
    private StudentStatus statut;
    private StudentYear annee;
    private Long filiereId;
}