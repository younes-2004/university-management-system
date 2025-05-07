package com.universite.academic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModuleDto {
    private Long id;
    private String nom;
    private String description;
    private Long filiereId;
    private String filiereNom;
    private Integer semestre;
    private Integer heuresCours;
    private Integer heuresTD;
    private Integer heuresTP;
    private Long professeurId;
    private String professeurNom;
}