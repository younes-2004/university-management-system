package com.universite.auth.service;

import com.universite.auth.dto.UserDto;
import com.universite.auth.entity.User;
import com.universite.auth.entity.enums.UserRole;
import com.universite.auth.exception.BadRequestException;
import com.universite.auth.exception.ResourceNotFoundException;
import com.universite.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private static final String USER_NOT_FOUND_WITH_ID = "Utilisateur non trouvé avec l'id : ";

    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND_WITH_ID + id));

        return mapToDto(user);
    }

    public UserDto getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'email : " + email));
        return mapToDto(user);
    }

    public List<UserDto> getUsersByRole(UserRole role) {
        return userRepository.findByRole(role)
                .stream()
                .map(this::mapToDto)
                .toList();  // Directly returning the result
    }


    public UserDto createUser(UserDto userDto, String rawPassword) {
        if (userRepository.existsByEmail(userDto.getEmail())) {
            throw new BadRequestException("Email déjà utilisé");
        }

        if (userDto.getNApogee() != null && userRepository.existsBynApogee(userDto.getNApogee())) {
            throw new BadRequestException("Numéro Apogée déjà utilisé");
        }

        User user = User.builder()
                .nom(userDto.getNom())
                .prenom(userDto.getPrenom())
                .email(userDto.getEmail())
                .password(passwordEncoder.encode(rawPassword))
                .dateNaissance(userDto.getDateNaissance())
                .role(userDto.getRole())
                .nApogee(userDto.getNApogee())
                .statut(userDto.getStatut())
                .annee(userDto.getAnnee())
                .filiereId(userDto.getFiliereId())
                .build();

        User savedUser = userRepository.save(user);
        return mapToDto(savedUser);
    }

    public UserDto updateUser(Long id, UserDto userDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND_WITH_ID + id));


        // Vérification de l'unicité de l'email (si modifié)
        if (!user.getEmail().equals(userDto.getEmail()) &&
                userRepository.existsByEmail(userDto.getEmail())) {
            throw new BadRequestException("Email déjà utilisé");
        }

        // Vérification de l'unicité du numéro Apogée (si modifié)
        if (userDto.getNApogee() != null &&
                !userDto.getNApogee().equals(user.getNApogee()) &&
                userRepository.existsBynApogee(userDto.getNApogee())) {
            throw new BadRequestException("Numéro Apogée déjà utilisé");
        }

        user.setNom(userDto.getNom());
        user.setPrenom(userDto.getPrenom());
        user.setEmail(userDto.getEmail());
        user.setDateNaissance(userDto.getDateNaissance());
        // Ne pas modifier le rôle ni le mot de passe ici

        // Mise à jour des champs spécifiques aux étudiants si nécessaire
        if (userDto.getRole() == UserRole.STUDENT) {
            user.setNApogee(userDto.getNApogee());
            user.setStatut(userDto.getStatut());
            user.setAnnee(userDto.getAnnee());
            user.setFiliereId(userDto.getFiliereId());
        }

        User updatedUser = userRepository.save(user);
        return mapToDto(updatedUser);
    }

    public void changePassword(Long id, String oldPassword, String newPassword) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND_WITH_ID + id));


        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new BadRequestException("Ancien mot de passe incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException(USER_NOT_FOUND_WITH_ID + id);
        }

        userRepository.deleteById(id);
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