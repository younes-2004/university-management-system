package com.universite.academic.service;

import com.universite.academic.entity.Module;
import com.universite.academic.dto.FiliereDto;
import com.universite.academic.entity.Filiere;
import com.universite.academic.repository.FiliereRepository;
import com.universite.academic.repository.ModuleRepository;
import com.universite.auth.entity.User;
import com.universite.auth.entity.enums.UserRole;
import com.universite.auth.exception.BadRequestException;
import com.universite.auth.exception.ResourceNotFoundException;
import com.universite.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FiliereService {
    private static final String FILIERE_NOT_FOUND = "Filière non trouvée avec l'id : ";

    private final FiliereRepository filiereRepository;
    private final UserRepository userRepository;
    private final ModuleRepository moduleRepository;

    @Transactional(readOnly = true)
    public List<FiliereDto> getAllFilieres() {
        return filiereRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList()); // Utilise collect au lieu de toList()
    }

    @Transactional(readOnly = true)
    public FiliereDto getFiliereById(Long id) {
        Filiere filiere = filiereRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(FILIERE_NOT_FOUND + id));
        return mapToDto(filiere);
    }

    @Transactional
    public FiliereDto createFiliere(FiliereDto filiereDto) {
        // Vérification du nom vide
        if (filiereDto.getNom() == null || filiereDto.getNom().trim().isEmpty()) {
            throw new BadRequestException("Le nom de la filière ne peut pas être vide");
        }

        // Vérification de la description vide
        if (filiereDto.getDescription() == null || filiereDto.getDescription().trim().isEmpty()) {
            throw new BadRequestException("La description de la filière ne peut pas être vide");
        }

        // Vérification que nombreAnnees n'est pas null
        if (filiereDto.getNombreAnnees() == null) {
            filiereDto.setNombreAnnees(2); // Valeur par défaut
        }

        if (filiereRepository.existsByNom(filiereDto.getNom())) {
            throw new BadRequestException("Une filière avec ce nom existe déjà");
        }

        Filiere filiere = Filiere.builder()
                .nom(filiereDto.getNom().trim())
                .description(filiereDto.getDescription().trim())
                .nombreAnnees(filiereDto.getNombreAnnees())
                .build();

        Filiere savedFiliere = filiereRepository.save(filiere);
        return mapToDto(savedFiliere);
    }

    @Transactional
    public FiliereDto updateFiliere(Long id, FiliereDto filiereDto) {
        Filiere filiere = filiereRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(FILIERE_NOT_FOUND + id));

        // Vérification du nom vide
        if (filiereDto.getNom() == null || filiereDto.getNom().trim().isEmpty()) {
            throw new BadRequestException("Le nom de la filière ne peut pas être vide");
        }

        // Vérification de la description vide
        if (filiereDto.getDescription() == null || filiereDto.getDescription().trim().isEmpty()) {
            throw new BadRequestException("La description de la filière ne peut pas être vide");
        }

        // Vérification de l'unicité du nom (si modifié)
        if (!filiere.getNom().equals(filiereDto.getNom()) &&
                filiereRepository.existsByNom(filiereDto.getNom())) {
            throw new BadRequestException("Une filière avec ce nom existe déjà");
        }

        // Mise à jour des champs
        filiere.setNom(filiereDto.getNom().trim());
        filiere.setDescription(filiereDto.getDescription().trim());

        // Mise à jour du nombre d'années si valeur fournie
        if (filiereDto.getNombreAnnees() != null) {
            filiere.setNombreAnnees(filiereDto.getNombreAnnees());
        }

        Filiere updatedFiliere = filiereRepository.save(filiere);
        return mapToDto(updatedFiliere);
    }

    @Transactional
    public void deleteFiliere(Long id) {
        Filiere filiere = filiereRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(FILIERE_NOT_FOUND + id));

        // Vérifier si des étudiants sont inscrits dans cette filière
        long studentCount = userRepository.countByRoleAndFiliereId(UserRole.STUDENT, id);

        if (studentCount > 0) {
            throw new BadRequestException("Impossible de supprimer cette filière car des étudiants y sont inscrits");
        }

        // Vérifier si des modules sont associés à cette filière
        if (!moduleRepository.findByFiliere(filiere).isEmpty()) {
            throw new BadRequestException("Impossible de supprimer cette filière car des modules y sont associés");
        }

        filiereRepository.delete(filiere);
    }

    @Transactional(readOnly = true)
    public List<FiliereDto> getFilieresByProfesseur(Long professeurId) {
        User professeur = userRepository.findById(professeurId)
                .orElseThrow(() -> new ResourceNotFoundException("Professeur non trouvé avec l'id : " + professeurId));

        if (professeur.getRole() != UserRole.PROFESSOR) {
            throw new BadRequestException("L'utilisateur n'est pas un professeur");
        }

        // Obtenez les modules enseignés par ce professeur
        List<Module> modules = moduleRepository.findByProfesseur(professeur);

        // Utiliser ConcurrentHashMap pour éviter les problèmes de concurrence
        // et collecter les filières uniques
        return modules.parallelStream()
                .map(Module::getFiliere)
                .collect(Collectors.toConcurrentMap(
                        Filiere::getId,
                        filiere -> filiere,
                        (existing, replacement) -> existing,
                        ConcurrentHashMap::new
                ))
                .values()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    // Version thread-safe de mapToDto
    private FiliereDto mapToDto(Filiere filiere) {
        // Utiliser des requêtes optimisées au lieu de findAll().stream()
        long studentCount = userRepository.countByRoleAndFiliereId(UserRole.STUDENT, filiere.getId());
        long moduleCount = moduleRepository.countByFiliere(filiere);

        return FiliereDto.builder()
                .id(filiere.getId())
                .nom(filiere.getNom())
                .description(filiere.getDescription())
                .nombreAnnees(filiere.getNombreAnnees())
                .nombreEtudiants((int) studentCount)
                .nombreModules((int) moduleCount)
                .build();
    }
}