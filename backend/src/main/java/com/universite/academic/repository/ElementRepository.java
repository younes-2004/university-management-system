package com.universite.academic.repository;

import com.universite.academic.entity.Element;
import com.universite.academic.entity.Module;
import com.universite.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ElementRepository extends JpaRepository<Element, Long> {
    List<Element> findByModule(Module module);
    List<Element> findByProfesseur(User professeur);
}