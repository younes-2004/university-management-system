package com.universite.student.service;

import com.universite.auth.entity.User;
import com.universite.auth.exception.BadRequestException;
import com.universite.auth.exception.ResourceNotFoundException;
import com.universite.auth.repository.UserRepository;
import com.universite.notification.entity.enums.NotificationType;
import com.universite.notification.service.NotificationService;
import com.universite.student.dto.CardRequestDto;
import com.universite.student.entity.CardRequest;
import com.universite.student.entity.enums.CardRequestStatus;
import com.universite.student.repository.CardRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CardRequestService {

    private final CardRequestRepository cardRequestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService; // Déplacé ici avec les autres dépendances

    @Transactional
    public CardRequestDto createCardRequest(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Étudiant non trouvé avec l'id : " + studentId));

        // Vérifier si l'étudiant a déjà une carte active ou une demande en cours
        cardRequestRepository.findTopByStudentOrderByRequestDateDesc(student)
                .ifPresent(existingRequest -> {
                    if (existingRequest.getStatus() == CardRequestStatus.RECEIVED) {
                        throw new BadRequestException("Vous avez déjà reçu votre carte étudiant");
                    }
                    if (existingRequest.getStatus() == CardRequestStatus.PENDING ||
                            existingRequest.getStatus() == CardRequestStatus.APPROVED) {
                        throw new BadRequestException("Vous avez déjà une demande en cours");
                    }
                });

        CardRequest cardRequest = CardRequest.builder()
                .student(student)
                .requestDate(LocalDateTime.now())
                .status(CardRequestStatus.PENDING)
                .build();

        CardRequest savedRequest = cardRequestRepository.save(cardRequest);
        return mapToDto(savedRequest);
    }

    @Transactional(readOnly = true)
    public List<CardRequestDto> getCardRequestsByStudent(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Étudiant non trouvé avec l'id : " + studentId));

        return cardRequestRepository.findByStudentOrderByRequestDateDesc(student)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CardRequestDto> getPendingCardRequests() {
        return cardRequestRepository.findByStatus(CardRequestStatus.PENDING)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    // Version unifiée de processCardRequest avec notification
    @Transactional
    public CardRequestDto processCardRequest(Long requestId, Long adminId, boolean approved) {
        CardRequest cardRequest = cardRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Demande non trouvée avec l'id : " + requestId));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Administrateur non trouvé avec l'id : " + adminId));

        if (cardRequest.getStatus() != CardRequestStatus.PENDING) {
            throw new BadRequestException("Cette demande a déjà été traitée");
        }

        cardRequest.setStatus(approved ? CardRequestStatus.APPROVED : CardRequestStatus.REJECTED);
        cardRequest.setProcessedDate(LocalDateTime.now());
        cardRequest.setProcessedBy(admin);

        CardRequest updatedRequest = cardRequestRepository.save(cardRequest);

        // Envoyer une notification à l'étudiant
        String message = approved
                ? "Votre demande de carte étudiant a été approuvée. Veuillez récupérer votre carte."
                : "Votre demande de carte étudiant a été rejetée.";

        NotificationType type = approved ? NotificationType.CARD_APPROVED : NotificationType.CARD_REJECTED;

        notificationService.createCardRequestNotification(
                cardRequest.getStudent().getId(),
                message,
                type
        );

        return mapToDto(updatedRequest);
    }

    @Transactional
    public CardRequestDto confirmCardReception(Long requestId, Long studentId) {
        CardRequest cardRequest = cardRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Demande non trouvée avec l'id : " + requestId));

        if (!cardRequest.getStudent().getId().equals(studentId)) {
            throw new BadRequestException("Cette demande ne vous appartient pas");
        }

        if (cardRequest.getStatus() != CardRequestStatus.APPROVED) {
            throw new BadRequestException("Cette carte n'est pas disponible pour récupération");
        }

        cardRequest.setStatus(CardRequestStatus.RECEIVED);
        cardRequest.setReceivedDate(LocalDateTime.now());

        CardRequest updatedRequest = cardRequestRepository.save(cardRequest);
        return mapToDto(updatedRequest);
    }

    private CardRequestDto mapToDto(CardRequest cardRequest) {
        return CardRequestDto.builder()
                .id(cardRequest.getId())
                .studentId(cardRequest.getStudent().getId())
                .studentName(cardRequest.getStudent().getNom() + " " + cardRequest.getStudent().getPrenom())
                .requestDate(cardRequest.getRequestDate())
                .status(cardRequest.getStatus())
                .processedDate(cardRequest.getProcessedDate())
                .receivedDate(cardRequest.getReceivedDate())
                .processedById(cardRequest.getProcessedBy() != null ? cardRequest.getProcessedBy().getId() : null)
                .processedByName(cardRequest.getProcessedBy() != null ?
                        cardRequest.getProcessedBy().getNom() + " " + cardRequest.getProcessedBy().getPrenom() : null)
                .build();
    }
}