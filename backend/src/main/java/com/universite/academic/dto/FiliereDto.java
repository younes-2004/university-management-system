package com.universite.academic.dto;

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
    private String nom;
    private String description;
    private int nombreEtudiants;
    private int nombreModules;
}