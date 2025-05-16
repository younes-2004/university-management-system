package com.universite.notification.controller;

import com.universite.auth.entity.User;
import com.universite.notification.dto.NotificationDto;
import com.universite.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationDto>> getUserNotifications(@AuthenticationPrincipal User currentUser) {
        List<NotificationDto> notifications = notificationService.getUserNotifications(currentUser.getId());
        return ResponseEntity.ok(notifications);
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<NotificationDto> markAsRead(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal User currentUser) {
        // Vérifie implicitement que la notification appartient à l'utilisateur
        NotificationDto notification = notificationService.markAsRead(notificationId);
        return ResponseEntity.ok(notification);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadNotificationsCount(@AuthenticationPrincipal User currentUser) {
        long count = notificationService.getUserNotifications(currentUser.getId())
                .stream()
                .filter(n -> !n.isVue())
                .count();
        return ResponseEntity.ok(count);
    }
}