package com.universite.academic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FiliereDto {
    private Long id;

    @NotBlank(message = "Le nom de la filière ne peut pas être vide")
    @Size(max = 100, message = "Le nom de la filière ne peut pas dépasser 100 caractères")
    private String nom;

    @NotBlank(message = "La description de la filière ne peut pas être vide")
    @Size(max = 500, message = "La description de la filière ne peut pas dépasser 500 caractères")
    private String description;

    private Integer nombreAnnees = 2;

    private int nombreEtudiants;
    private int nombreModules;
}