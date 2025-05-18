package com.universite.academic.entity;

import com.universite.auth.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.concurrent.ConcurrentHashMap;
import java.util.Set;

@Entity
@Table(name = "modules")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Module {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "filiere_id", nullable = false)
    private Filiere filiere;

    @Column(nullable = false)
    private Integer semestre;

    @Column(nullable = false)
    private Integer heuresCours;

    @Column(nullable = false)
    private Integer heuresTD;

    @Column(nullable = false)
    private Integer heuresTP;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "professeur_id")
    private User professeur;

    // Utilisation de ConcurrentHashMap pour éviter les ConcurrentModificationException
    @OneToMany(mappedBy = "module", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<Element> elements = ConcurrentHashMap.newKeySet();

    // Méthodes utilitaires pour gérer la relation bidirectionnelle avec Element
    public synchronized void addElement(Element element) {
        elements.add(element);
        element.setModule(this);
    }

    public synchronized void removeElement(Element element) {
        elements.remove(element);
        element.setModule(null);
    }
}