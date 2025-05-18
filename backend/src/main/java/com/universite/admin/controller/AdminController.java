package com.universite.admin.controller;

import com.universite.auth.entity.User;
import com.universite.notification.service.student.dto.CardRequestDto;
import com.universite.notification.service.student.service.CardRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final CardRequestService cardRequestService;

    @GetMapping("/card-requests")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CardRequestDto>> getPendingCardRequests() {
        List<CardRequestDto> pendingRequests = cardRequestService.getPendingCardRequests();
        return ResponseEntity.ok(pendingRequests);
    }

    @PutMapping("/card-requests/{requestId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CardRequestDto> approveCardRequest(
            @PathVariable Long requestId,
            @AuthenticationPrincipal User currentUser) {
        CardRequestDto approvedRequest = cardRequestService.processCardRequest(requestId, currentUser.getId(), true);
        return ResponseEntity.ok(approvedRequest);
    }

    @PutMapping("/card-requests/{requestId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CardRequestDto> rejectCardRequest(
            @PathVariable Long requestId,
            @AuthenticationPrincipal User currentUser) {
        CardRequestDto rejectedRequest = cardRequestService.processCardRequest(requestId, currentUser.getId(), false);
        return ResponseEntity.ok(rejectedRequest);
    }
    // Ajouts dans AdminController.java

    @GetMapping("/students/{studentId}/card-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CardRequestDto> getStudentCardStatus(@PathVariable Long studentId) {
        List<CardRequestDto> requests = cardRequestService.getCardRequestsByStudent(studentId);
        if (requests.isEmpty()) {
            return ResponseEntity.ok(null); // Aucune demande
        }
        // Retourner la demande la plus récente
        return ResponseEntity.ok(requests.get(0));
    }

    @PostMapping("/card-requests/bulk-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getBulkCardStatus(@RequestBody Map<String, List<Long>> request) {
        List<Long> studentIds = request.get("studentIds");
        List<Map<String, Object>> statuses = new ArrayList<>();

        for (Long studentId : studentIds) {
            List<CardRequestDto> requests = cardRequestService.getCardRequestsByStudent(studentId);
            Map<String, Object> status = new HashMap<>();
            status.put("studentId", studentId);

            if (requests.isEmpty()) {
                status.put("status", null);
            } else {
                status.put("status", requests.get(0).getStatus().toString());
            }

            statuses.add(status);
        }

        return ResponseEntity.ok(statuses);
    }
}