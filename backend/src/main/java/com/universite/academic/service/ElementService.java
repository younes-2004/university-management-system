package com.universite.academic.service;

import com.universite.academic.dto.ElementDto;
import com.universite.academic.entity.Element;
import com.universite.academic.entity.Module;
import com.universite.academic.repository.ElementRepository;
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
public class ElementService {
    private static final String ELEMENT_NOT_FOUND = "Element non trouvé avec l'id : ";
    private static final String PROFESSOR_NOT_FOUND = "Professeur non trouvé avec l'id : ";
    private static final String USER_NOT_PROFESSOR = "L'utilisateur n'est pas un professeur";
    private static final String MODULE_NOT_FOUND = "Module non trouvé avec l'id : ";

    private final ElementRepository elementRepository;
    private final ModuleRepository moduleRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ElementDto> getAllElements() {
        return elementRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ElementDto getElementById(Long id) {
        Element element = elementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ELEMENT_NOT_FOUND + id));
        return mapToDto(element);
    }

    @Transactional(readOnly = true)
    public List<ElementDto> getElementsByModule(Long moduleId) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException(MODULE_NOT_FOUND + moduleId));

        return elementRepository.findByModule(module).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ElementDto> getElementsByProfesseur(Long professeurId) {
        User professeur = userRepository.findById(professeurId)
                .orElseThrow(() -> new ResourceNotFoundException(PROFESSOR_NOT_FOUND + professeurId));

        if (professeur.getRole() != UserRole.PROFESSOR) {
            throw new BadRequestException(USER_NOT_PROFESSOR);
        }

        return elementRepository.findByProfesseur(professeur).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ElementDto createElement(ElementDto elementDto) {
        Module module = moduleRepository.findById(elementDto.getModuleId())
                .orElseThrow(() -> new ResourceNotFoundException(MODULE_NOT_FOUND + elementDto.getModuleId()));

        User professeur = null;
        if (elementDto.getProfesseurId() != null) {
            professeur = userRepository.findById(elementDto.getProfesseurId())
                    .orElseThrow(() -> new ResourceNotFoundException(PROFESSOR_NOT_FOUND + elementDto.getProfesseurId()));

            if (professeur.getRole() != UserRole.PROFESSOR) {
                throw new BadRequestException(USER_NOT_PROFESSOR);
            }
        }

        Element element = Element.builder()
                .nom(elementDto.getNom())
                .description(elementDto.getDescription())
                .module(module)
                .heuresCours(elementDto.getHeuresCours())
                .heuresTD(elementDto.getHeuresTD())
                .heuresTP(elementDto.getHeuresTP())
                .professeur(professeur)
                .build();

        Element savedElement = elementRepository.save(element);
        return mapToDto(savedElement);
    }

    @Transactional
    public ElementDto updateElement(Long id, ElementDto elementDto) {
        Element element = elementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ELEMENT_NOT_FOUND + id));

        Module module = moduleRepository.findById(elementDto.getModuleId())
                .orElseThrow(() -> new ResourceNotFoundException(MODULE_NOT_FOUND + elementDto.getModuleId()));

        User professeur = null;
        if (elementDto.getProfesseurId() != null) {
            professeur = userRepository.findById(elementDto.getProfesseurId())
                    .orElseThrow(() -> new ResourceNotFoundException(PROFESSOR_NOT_FOUND + elementDto.getProfesseurId()));

            if (professeur.getRole() != UserRole.PROFESSOR) {
                throw new BadRequestException(USER_NOT_PROFESSOR);
            }
        }

        element.setNom(elementDto.getNom());
        element.setDescription(elementDto.getDescription());
        element.setModule(module);
        element.setHeuresCours(elementDto.getHeuresCours());
        element.setHeuresTD(elementDto.getHeuresTD());
        element.setHeuresTP(elementDto.getHeuresTP());
        element.setProfesseur(professeur);

        Element updatedElement = elementRepository.save(element);
        return mapToDto(updatedElement);
    }

    @Transactional
    public void deleteElement(Long id) {
        Element element = elementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ELEMENT_NOT_FOUND + id));

        elementRepository.delete(element);
    }

    private ElementDto mapToDto(Element element) {
        return ElementDto.builder()
                .id(element.getId())
                .nom(element.getNom())
                .description(element.getDescription())
                .moduleId(element.getModule().getId())
                .moduleNom(element.getModule().getNom())
                .heuresCours(element.getHeuresCours())
                .heuresTD(element.getHeuresTD())
                .heuresTP(element.getHeuresTP())
                .professeurId(element.getProfesseur() != null ? element.getProfesseur().getId() : null)
                .professeurNom(element.getProfesseur() != null ?
                        element.getProfesseur().getNom() + " " + element.getProfesseur().getPrenom() : null)
                .build();
    }
}