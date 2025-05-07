package com.universite.notification.dto;

import com.universite.notification.entity.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private Long id;
    private Long userId;
    private String userName;
    private String message;
    private NotificationType type;
    private LocalDateTime dateCreation;
    private LocalDateTime dateLecture;
    private boolean vue;
}