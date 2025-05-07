package com.universite.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {
    // Statistiques des utilisateurs
    private long totalStudents;
    private long totalProfessors;
    private long totalAdmins;
    private long activeStudents;
    private long suspendedStudents;

    // Statistiques académiques
    private long totalFilieres;
    private long totalModules;
    private long totalElements;

    // Statistiques des cartes étudiantes
    private long pendingCardRequests;
    private long approvedCardRequests;
    private long rejectedCardRequests;
    private long receivedCardRequests;
}