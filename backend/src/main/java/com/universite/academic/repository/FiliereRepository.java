package com.universite.academic.repository;

import com.universite.academic.entity.Filiere;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FiliereRepository extends JpaRepository<Filiere, Long> {
    Optional<Filiere> findByNom(String nom);
    boolean existsByNom(String nom);
}