package com.universite.academic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ElementDto {
    private Long id;
    private String nom;
    private String description;
    private Long moduleId;
    private String moduleNom;
    private Integer heuresCours;
    private Integer heuresTD;
    private Integer heuresTP;
    private Long professeurId;
    private String professeurNom;
}