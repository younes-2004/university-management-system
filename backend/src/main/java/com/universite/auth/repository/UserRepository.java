package com.universite.auth.repository;

import com.universite.auth.entity.User;
import com.universite.auth.entity.enums.StudentStatus;
import com.universite.auth.entity.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsBynApogee(String nApogee);

    List<User> findByRole(UserRole role);

    Optional<User> findBynApogee(String nApogee);

    // Méthodes de comptage pour le dashboard
    long countByRole(UserRole role);

    long countByRoleAndStatut(UserRole role, StudentStatus statut);

    // Nouvelle méthode pour compter les étudiants par filière de manière thread-safe
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.filiereId = :filiereId")
    long countByRoleAndFiliereId(@Param("role") UserRole role, @Param("filiereId") Long filiereId);

    // Méthode pour récupérer les étudiants par filière de manière optimisée
    @Query("SELECT u FROM User u WHERE u.role = :role AND u.filiereId = :filiereId")
    List<User> findByRoleAndFiliereId(@Param("role") UserRole role, @Param("filiereId") Long filiereId);
}