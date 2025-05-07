package com.universite.notification.service;

import com.universite.auth.entity.User;
import com.universite.auth.repository.UserRepository;
import com.universite.notification.dto.NotificationDto;
import com.universite.notification.entity.Notification;
import com.universite.notification.entity.enums.NotificationType;
import com.universite.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public NotificationDto createCardRequestNotification(Long studentId, String message, NotificationType type) {
        User student = userRepository.findById(studentId).orElseThrow();

        Notification notification = Notification.builder()
                .user(student)
                .message(message)
                .type(type)
                .dateCreation(LocalDateTime.now())
                .vue(false)
                .build();

        Notification savedNotification = notificationRepository.save(notification);
        return mapToDto(savedNotification);
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getUserNotifications(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();

        return notificationRepository.findByUserOrderByDateCreationDesc(user)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public NotificationDto markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId).orElseThrow();
        notification.setVue(true);
        notification.setDateLecture(LocalDateTime.now());

        Notification updatedNotification = notificationRepository.save(notification);
        return mapToDto(updatedNotification);
    }

    private NotificationDto mapToDto(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .userId(notification.getUser().getId())
                .userName(notification.getUser().getNom() + " " + notification.getUser().getPrenom())
                .message(notification.getMessage())
                .type(notification.getType())
                .dateCreation(notification.getDateCreation())
                .dateLecture(notification.getDateLecture())
                .vue(notification.isVue())
                .build();
    }
}