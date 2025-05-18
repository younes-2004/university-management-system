package com.universite.academic.entity;

import com.universite.auth.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.concurrent.ConcurrentHashMap;
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

    @NotBlank(message = "Le nom de la filière ne peut pas être vide")
    @Size(max = 100, message = "Le nom de la filière ne peut pas dépasser 100 caractères")
    @Column(nullable = false, unique = true)
    private String nom;

    @NotBlank(message = "La description de la filière ne peut pas être vide")
    @Size(max = 500, message = "La description de la filière ne peut pas dépasser 500 caractères")
    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private Integer nombreAnnees = 2; // Par défaut 2 années d'études

    // Relation avec les modules - utilisation de ConcurrentHashMap pour éviter les ConcurrentModificationException
    @OneToMany(mappedBy = "filiere", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @ToString.Exclude  // Pour éviter les problèmes de récursion avec toString()
    @Builder.Default
    private Set<Module> modules = ConcurrentHashMap.newKeySet();

    // Au lieu d'une relation OneToMany directe avec JoinColumn, utilisez une requête JPQL
    // Cela évite le mapping en double de la colonne filiere_id
    @Transient // Ce champ n'est pas persisté
    private transient java.util.List<User> etudiants;

    // Méthodes utilitaires pour gérer la relation bidirectionnelle avec Module
    public synchronized void addModule(Module module) {
        modules.add(module);
        module.setFiliere(this);
    }

    public synchronized void removeModule(Module module) {
        modules.remove(module);
        module.setFiliere(null);
    }
}