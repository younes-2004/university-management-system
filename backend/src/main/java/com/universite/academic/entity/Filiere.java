package com.universite.academic.entity;

import com.universite.auth.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "filieres")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Filiere {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nom;

    @Column(nullable = false)
    private String description;

    // Relation avec les modules
    @OneToMany(mappedBy = "filiere", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude  // Pour éviter les problèmes de récursion avec toString()
    private Set<Module> modules = new HashSet<>();

    // Au lieu d'une relation OneToMany directe avec JoinColumn, utilisez une requête JPQL
    // Cela évite le mapping en double de la colonne filiere_id
    @Transient // Ce champ n'est pas persisté
    private transient java.util.List<User> etudiants;

    // Méthodes utilitaires pour gérer la relation bidirectionnelle avec Module
    public void addModule(Module module) {
        modules.add(module);
        module.setFiliere(this);
    }

    public void removeModule(Module module) {
        modules.remove(module);
        module.setFiliere(null);
    }
}