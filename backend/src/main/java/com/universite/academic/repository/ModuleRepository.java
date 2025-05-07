package com.universite.academic.repository;

import com.universite.academic.entity.Filiere;
import com.universite.academic.entity.Module;
import com.universite.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ModuleRepository extends JpaRepository<Module, Long> {
    List<Module> findByFiliere(Filiere filiere);
    List<Module> findByProfesseur(User professeur);
    List<Module> findByFiliereAndSemestre(Filiere filiere, Integer semestre);
}