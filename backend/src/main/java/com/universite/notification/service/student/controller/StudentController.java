package com.universite.notification.service.student.controller;

import com.universite.auth.entity.User;
import com.universite.notification.service.student.dto.CardRequestDto;
import com.universite.notification.service.student.service.CardRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StudentController {

    private final CardRequestService cardRequestService;

    @GetMapping("/card-requests")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<CardRequestDto>> getMyCardRequests(@AuthenticationPrincipal User currentUser) {
        List<CardRequestDto> requests = cardRequestService.getCardRequestsByStudent(currentUser.getId());
        return ResponseEntity.ok(requests);
    }

    @PostMapping("/card-requests")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<CardRequestDto> createCardRequest(@AuthenticationPrincipal User currentUser) {
        CardRequestDto newRequest = cardRequestService.createCardRequest(currentUser.getId());
        return ResponseEntity.ok(newRequest);
    }

    @PutMapping("/card-requests/{requestId}/confirm-reception")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<CardRequestDto> confirmCardReception(
            @PathVariable Long requestId,
            @AuthenticationPrincipal User currentUser) {
        CardRequestDto updatedRequest = cardRequestService.confirmCardReception(requestId, currentUser.getId());
        return ResponseEntity.ok(updatedRequest);
    }
}