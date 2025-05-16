package com.universite.notification.service.student.repository;

import com.universite.auth.entity.User;
import com.universite.notification.service.student.entity.CardRequest;
import com.universite.notification.service.student.entity.enums.CardRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CardRequestRepository extends JpaRepository<CardRequest, Long> {

    List<CardRequest> findByStudentOrderByRequestDateDesc(User student);

    List<CardRequest> findByStatus(CardRequestStatus status);

    Optional<CardRequest> findTopByStudentOrderByRequestDateDesc(User student);

    long countByStatus(CardRequestStatus status);
}