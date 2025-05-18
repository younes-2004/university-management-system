package com.universite.auth.service;

import com.universite.auth.dto.UserDto;
import com.universite.auth.entity.User;
import com.universite.auth.entity.enums.UserRole;
import com.universite.auth.exception.BadRequestException;
import com.universite.auth.exception.ResourceNotFoundException;
import com.universite.auth.repository.UserRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private static final String USER_NOT_FOUND_WITH_ID = "Utilisateur non trouvé avec l'id : ";

    @Transactional(readOnly = true)
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND_WITH_ID + id));

        return mapToDto(user);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getStudentsByFiliere(Long filiereId) {
        return userRepository.findByRoleAndFiliereId(UserRole.STUDENT, filiereId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserDto getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'email : " + email));
        return mapToDto(user);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getUsersByRole(UserRole role) {
        return userRepository.findByRole(role)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDto createUser(UserDto userDto, String rawPassword) {
        // Validations de base
        validateUserDto(userDto, true);

        if (userRepository.existsByEmail(userDto.getEmail())) {
            throw new BadRequestException("Email déjà utilisé");
        }

        // Validation spécifique pour les étudiants
        if (userDto.getRole() == UserRole.STUDENT) {
            validateStudentFields(userDto, true);
        }

        User user = User.builder()
                .nom(userDto.getNom().trim())
                .prenom(userDto.getPrenom().trim())
                .email(userDto.getEmail().trim())
                .password(passwordEncoder.encode(rawPassword))
                .dateNaissance(userDto.getDateNaissance())
                .role(userDto.getRole())
                .nApogee(userDto.getNApogee() != null ? userDto.getNApogee().trim() : null)
                .statut(userDto.getStatut())
                .annee(userDto.getAnnee())
                .filiereId(userDto.getFiliereId())
                .build();

        User savedUser = userRepository.save(user);

        System.out.println("Utilisateur créé avec succès - ID: " + savedUser.getId() +
                ", Email: " + savedUser.getEmail() +
                ", Rôle: " + savedUser.getRole() +
                ", Apogée: " + savedUser.getNApogee());

        return mapToDto(savedUser);
    }

    @Transactional
    public UserDto updateUser(Long id, UserDto userDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND_WITH_ID + id));

        System.out.println("=== MISE À JOUR UTILISATEUR ===");
        System.out.println("ID: " + id);
        System.out.println("Données reçues dans DTO: " + userDto);
        System.out.println("nApogee reçu: '" + userDto.getNApogee() + "'");
        System.out.println("nApogee actuel en DB: '" + user.getNApogee() + "'");

        // Validation des champs de base
        validateUserDto(userDto, false);

        // Vérification de l'unicité de l'email (si modifié)
        if (!user.getEmail().equals(userDto.getEmail()) &&
                userRepository.existsByEmail(userDto.getEmail())) {
            throw new BadRequestException("Email déjà utilisé");
        }

        // Mise à jour des champs de base pour TOUS les utilisateurs
        user.setNom(userDto.getNom().trim());
        user.setPrenom(userDto.getPrenom().trim());
        user.setEmail(userDto.getEmail().trim());
        user.setDateNaissance(userDto.getDateNaissance());

        // Mise à jour du rôle si fourni
        if (userDto.getRole() != null) {
            user.setRole(userDto.getRole());
        }

        // Gestion spécifique selon le rôle
        UserRole currentRole = user.getRole();
        UserRole newRole = userDto.getRole() != null ? userDto.getRole() : currentRole;

        if (newRole == UserRole.STUDENT) {
            System.out.println("Traitement des champs étudiant...");

            // Validation du numéro Apogée
            if (userDto.getNApogee() == null || userDto.getNApogee().trim().isEmpty()) {
                throw new BadRequestException("Le numéro Apogée est obligatoire pour un étudiant");
            }

            // Vérification de l'unicité du numéro Apogée (si modifié)
            String newApogee = userDto.getNApogee().trim();
            if (!newApogee.equals(user.getNApogee()) &&
                    userRepository.existsBynApogee(newApogee)) {
                throw new BadRequestException("Numéro Apogée déjà utilisé");
            }

            // Validation de la filière
            if (userDto.getFiliereId() == null) {
                throw new BadRequestException("La filière est obligatoire pour un étudiant");
            }

            // MISE À JOUR FORCÉE de tous les champs étudiants
            user.setNApogee(newApogee);
            user.setStatut(userDto.getStatut());
            user.setAnnee(userDto.getAnnee());
            user.setFiliereId(userDto.getFiliereId());

            System.out.println("Après mise à jour - nApogee: '" + user.getNApogee() + "'");
            System.out.println("Après mise à jour - statut: " + user.getStatut());
            System.out.println("Après mise à jour - annee: " + user.getAnnee());
            System.out.println("Après mise à jour - filiereId: " + user.getFiliereId());
        } else {
            // Pour les non-étudiants, nettoyer les champs spécifiques aux étudiants
            user.setNApogee(null);
            user.setStatut(null);
            user.setAnnee(null);
            user.setFiliereId(null);
        }

        // Sauvegarder IMMÉDIATEMENT
        User updatedUser = userRepository.saveAndFlush(user);

        // Vérification après sauvegarde
        System.out.println("Utilisateur sauvegardé en base:");
        System.out.println("- ID: " + updatedUser.getId());
        System.out.println("- Nom: " + updatedUser.getNom());
        System.out.println("- Prénom: " + updatedUser.getPrenom());
        System.out.println("- Email: " + updatedUser.getEmail());
        System.out.println("- Rôle: " + updatedUser.getRole());
        System.out.println("- nApogee: '" + updatedUser.getNApogee() + "'");
        System.out.println("- Filière: " + updatedUser.getFiliereId());
        System.out.println("- Statut: " + updatedUser.getStatut());
        System.out.println("- Année: " + updatedUser.getAnnee());
        System.out.println("=== FIN MISE À JOUR ===");

        return mapToDto(updatedUser);
    }

    // Dans UserService.java - Remplacer la méthode changePassword
    @Transactional
    public void changePassword(Long id, String oldPassword, String newPassword) {
        System.out.println("=== SERVICE CHANGEMENT MOT DE PASSE ===");
        System.out.println("User ID: " + id);
        System.out.println("Ancien mot de passe fourni: " + (oldPassword != null ? "***" : "null"));
        System.out.println("Nouveau mot de passe fourni: " + (newPassword != null ? "***" : "null"));

        // Validation des paramètres
        if (oldPassword == null || oldPassword.trim().isEmpty()) {
            throw new BadRequestException("L'ancien mot de passe est obligatoire");
        }

        if (newPassword == null || newPassword.trim().isEmpty()) {
            throw new BadRequestException("Le nouveau mot de passe est obligatoire");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND_WITH_ID + id));

        System.out.println("Utilisateur trouvé: " + user.getEmail());

        // Vérification de l'ancien mot de passe
        boolean matches = passwordEncoder.matches(oldPassword, user.getPassword());
        System.out.println("Ancien mot de passe correspond: " + matches);

        if (!matches) {
            throw new BadRequestException("Ancien mot de passe incorrect");
        }

        // Changer le mot de passe
        String encodedNewPassword = passwordEncoder.encode(newPassword);
        user.setPassword(encodedNewPassword);
        userRepository.save(user);

        System.out.println("Mot de passe changé avec succès pour: " + user.getEmail());
    }


    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException(USER_NOT_FOUND_WITH_ID + id);
        }

        userRepository.deleteById(id);
    }

    // Méthodes de validation
    private void validateUserDto(UserDto userDto, boolean isCreation) {
        if (userDto.getEmail() == null || userDto.getEmail().trim().isEmpty()) {
            throw new BadRequestException("L'email est obligatoire");
        }

        if (userDto.getNom() == null || userDto.getNom().trim().isEmpty()) {
            throw new BadRequestException("Le nom est obligatoire");
        }

        if (userDto.getPrenom() == null || userDto.getPrenom().trim().isEmpty()) {
            throw new BadRequestException("Le prénom est obligatoire");
        }

        if (isCreation && userDto.getRole() == null) {
            throw new BadRequestException("Le rôle est obligatoire");
        }
    }

    private void validateStudentFields(UserDto userDto, boolean checkNullValues) {
        if (checkNullValues && (userDto.getNApogee() == null || userDto.getNApogee().trim().isEmpty())) {
            throw new BadRequestException("Le numéro Apogée est obligatoire pour un étudiant");
        }

        if (checkNullValues && userDto.getFiliereId() == null) {
            throw new BadRequestException("La filière est obligatoire pour un étudiant");
        }
    }

    // Méthode utilitaire pour convertir une entité User en DTO
    private UserDto mapToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .email(user.getEmail())
                .dateNaissance(user.getDateNaissance())
                .role(user.getRole())
                .nApogee(user.getNApogee())
                .statut(user.getStatut())
                .annee(user.getAnnee())
                .filiereId(user.getFiliereId())
                .build();
    }
}