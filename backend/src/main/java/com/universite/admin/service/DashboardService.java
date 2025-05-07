package com.universite.admin.service;

import com.universite.academic.repository.ElementRepository;
import com.universite.academic.repository.FiliereRepository;
import com.universite.academic.repository.ModuleRepository;
import com.universite.admin.dto.DashboardStats;
import com.universite.auth.entity.enums.StudentStatus;
import com.universite.auth.entity.enums.UserRole;
import com.universite.auth.repository.UserRepository;
import com.universite.student.entity.enums.CardRequestStatus;
import com.universite.student.repository.CardRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final FiliereRepository filiereRepository;
    private final ModuleRepository moduleRepository;
    private final ElementRepository elementRepository;
    private final CardRequestRepository cardRequestRepository;

    @Transactional(readOnly = true)
    public DashboardStats getDashboardStats() {
        long totalStudents = userRepository.countByRole(UserRole.STUDENT);
        long totalProfessors = userRepository.countByRole(UserRole.PROFESSOR);
        long totalAdmins = userRepository.countByRole(UserRole.ADMIN);

        long activeStudents = userRepository.countByRoleAndStatut(UserRole.STUDENT, StudentStatus.ACTIF);
        long suspendedStudents = userRepository.countByRoleAndStatut(UserRole.STUDENT, StudentStatus.SUSPENDU);

        long totalFilieres = filiereRepository.count();
        long totalModules = moduleRepository.count();
        long totalElements = elementRepository.count();

        long pendingCardRequests = cardRequestRepository.countByStatus(CardRequestStatus.PENDING);
        long approvedCardRequests = cardRequestRepository.countByStatus(CardRequestStatus.APPROVED);
        long rejectedCardRequests = cardRequestRepository.countByStatus(CardRequestStatus.REJECTED);
        long receivedCardRequests = cardRequestRepository.countByStatus(CardRequestStatus.RECEIVED);

        return DashboardStats.builder()
                .totalStudents(totalStudents)
                .totalProfessors(totalProfessors)
                .totalAdmins(totalAdmins)
                .activeStudents(activeStudents)
                .suspendedStudents(suspendedStudents)
                .totalFilieres(totalFilieres)
                .totalModules(totalModules)
                .totalElements(totalElements)
                .pendingCardRequests(pendingCardRequests)
                .approvedCardRequests(approvedCardRequests)
                .rejectedCardRequests(rejectedCardRequests)
                .receivedCardRequests(receivedCardRequests)
                .build();
    }
}