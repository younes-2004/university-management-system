package com.universite.config;

import com.universite.academic.entity.Filiere;
import com.universite.academic.repository.FiliereRepository;
import com.universite.auth.entity.User;
import com.universite.auth.entity.enums.StudentStatus;
import com.universite.auth.entity.enums.StudentYear;
import com.universite.auth.entity.enums.UserRole;
import com.universite.auth.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;

@Configuration
@Profile("dev") // Active uniquement en profil de développement
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(UserRepository userRepository,
                                      FiliereRepository filiereRepository,
                                      PasswordEncoder passwordEncoder) {
        return args -> {
            // Vérifier si des données existent déjà
            if (userRepository.count() > 0) {
                return; // Ne pas réinitialiser si la base contient déjà des données
            }

            // Créer un admin
            User admin = User.builder()
                    .email("admin@university.com")
                    .password(passwordEncoder.encode("0000"))
                    .nom("Admin")
                    .prenom("System")
                    .dateNaissance(LocalDate.of(1980, 1, 1))
                    .role(UserRole.ADMIN)
                    .build();
            userRepository.save(admin);

            // Créer des filières
            Filiere informatique = Filiere.builder()
                    .nom("Informatique")
                    .description("Filière d'ingénierie informatique")
                    .build();
            filiereRepository.save(informatique);

            // Créer un professeur
            User professeur = User.builder()
                    .email("prof@university.com")
                    .password(passwordEncoder.encode("1111"))
                    .nom("Martin")
                    .prenom("Pierre")
                    .dateNaissance(LocalDate.of(1975, 5, 15))
                    .role(UserRole.PROFESSOR)
                    .build();
            userRepository.save(professeur);

            // Créer un étudiant
            User etudiant = User.builder()
                    .email("etudiant@university.com")
                    .password(passwordEncoder.encode("2222"))
                    .nom("Dubois")
                    .prenom("Jean")
                    .dateNaissance(LocalDate.of(2000, 10, 5))
                    .role(UserRole.STUDENT)
                    .nApogee("APO12345")
                    .statut(StudentStatus.ACTIF)
                    .annee(StudentYear.PREMIERE_ANNEE)
                    .filiereId(informatique.getId())
                    .build();
            userRepository.save(etudiant);

            System.out.println("Données de test initialisées avec succès!");
        };
    }
}