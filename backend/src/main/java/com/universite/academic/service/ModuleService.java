package com.universite.academic.service;

import com.universite.academic.dto.ModuleDto;
import com.universite.academic.entity.Filiere;
import com.universite.academic.entity.Module;
import com.universite.academic.repository.ElementRepository;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ModuleService {
    public static final String FILIERE_NOT_FOUND = "Filière non trouvée avec l'id : ";
    public static final String PROFESSEUR_NOT_FOUND = "Professeur non trouvé avec l'id : ";
    public static final String MODULE_NOT_FOUND = "Module non trouvé avec l'id : ";
    public static final String USER_IS_NOT_A_PROFESSOR = "L'utilisateur n'est pas un professeur";
    private final ModuleRepository moduleRepository;
    private final FiliereRepository filiereRepository;
    private final UserRepository userRepository;
    private final ElementRepository elementRepository;

    @Transactional(readOnly = true)
    public List<ModuleDto> getAllModules() {
        return moduleRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ModuleDto getModuleById(Long id) {
        Module module = moduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(MODULE_NOT_FOUND + id));
        return mapToDto(module);
    }

    @Transactional(readOnly = true)
    public List<ModuleDto> getModulesByFiliere(Long filiereId) {
        Filiere filiere = filiereRepository.findById(filiereId)
                .orElseThrow(() -> new ResourceNotFoundException(FILIERE_NOT_FOUND + filiereId));

        return moduleRepository.findByFiliere(filiere).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ModuleDto> getModulesByProfesseur(Long professeurId) {
        User professeur = userRepository.findById(professeurId)
                .orElseThrow(() -> new ResourceNotFoundException(PROFESSEUR_NOT_FOUND + professeurId));

        if (professeur.getRole() != UserRole.PROFESSOR) {
            throw new BadRequestException(USER_IS_NOT_A_PROFESSOR);
        }

        return moduleRepository.findByProfesseur(professeur).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ModuleDto> getModulesByFiliereAndSemestre(Long filiereId, Integer semestre) {
        Filiere filiere = filiereRepository.findById(filiereId)
                .orElseThrow(() -> new ResourceNotFoundException(FILIERE_NOT_FOUND + filiereId));

        return moduleRepository.findByFiliereAndSemestre(filiere, semestre).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ModuleDto createModule(ModuleDto moduleDto) {
        Filiere filiere = filiereRepository.findById(moduleDto.getFiliereId())
                .orElseThrow(() -> new ResourceNotFoundException(FILIERE_NOT_FOUND + moduleDto.getFiliereId()));

        User professeur = null;
        if (moduleDto.getProfesseurId() != null) {
            professeur = userRepository.findById(moduleDto.getProfesseurId())
                    .orElseThrow(() -> new ResourceNotFoundException(PROFESSEUR_NOT_FOUND + moduleDto.getProfesseurId()));

            if (professeur.getRole() != UserRole.PROFESSOR) {
                throw new BadRequestException(USER_IS_NOT_A_PROFESSOR);
            }
        }

        Module module = Module.builder()
                .nom(moduleDto.getNom())
                .description(moduleDto.getDescription())
                .filiere(filiere)
                .semestre(moduleDto.getSemestre())
                .heuresCours(moduleDto.getHeuresCours())
                .heuresTD(moduleDto.getHeuresTD())
                .heuresTP(moduleDto.getHeuresTP())
                .professeur(professeur)
                .build();

        Module savedModule = moduleRepository.save(module);
        return mapToDto(savedModule);
    }

    @Transactional
    public ModuleDto updateModule(Long id, ModuleDto moduleDto) {
        Module module = moduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(MODULE_NOT_FOUND + id));

        Filiere filiere = filiereRepository.findById(moduleDto.getFiliereId())
                .orElseThrow(() -> new ResourceNotFoundException(FILIERE_NOT_FOUND + moduleDto.getFiliereId()));

        User professeur = null;
        if (moduleDto.getProfesseurId() != null) {
            professeur = userRepository.findById(moduleDto.getProfesseurId())
                    .orElseThrow(() -> new ResourceNotFoundException(PROFESSEUR_NOT_FOUND + moduleDto.getProfesseurId()));

            if (professeur.getRole() != UserRole.PROFESSOR) {
                throw new BadRequestException(USER_IS_NOT_A_PROFESSOR);
            }
        }

        module.setNom(moduleDto.getNom());
        module.setDescription(moduleDto.getDescription());
        module.setFiliere(filiere);
        module.setSemestre(moduleDto.getSemestre());
        module.setHeuresCours(moduleDto.getHeuresCours());
        module.setHeuresTD(moduleDto.getHeuresTD());
        module.setHeuresTP(moduleDto.getHeuresTP());
        module.setProfesseur(professeur);

        Module updatedModule = moduleRepository.save(module);
        return mapToDto(updatedModule);
    }

    @Transactional
    public void deleteModule(Long id) {
        Module module = moduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(MODULE_NOT_FOUND + id));

        // Vérifier si des éléments sont associés à ce module
        if (!elementRepository.findByModule(module).isEmpty()) {
            throw new BadRequestException("Impossible de supprimer ce module car des éléments y sont associés");
        }

        moduleRepository.delete(module);
    }

    private ModuleDto mapToDto(Module module) {
        return ModuleDto.builder()
                .id(module.getId())
                .nom(module.getNom())
                .description(module.getDescription())
                .filiereId(module.getFiliere().getId())
                .filiereNom(module.getFiliere().getNom())
                .semestre(module.getSemestre())
                .heuresCours(module.getHeuresCours())
                .heuresTD(module.getHeuresTD())
                .heuresTP(module.getHeuresTP())
                .professeurId(module.getProfesseur() != null ? module.getProfesseur().getId() : null)
                .professeurNom(module.getProfesseur() != null ?
                        module.getProfesseur().getNom() + " " + module.getProfesseur().getPrenom() : null)
                .build();
    }
}