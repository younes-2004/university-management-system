package com.universite.notification.service.student.dto;

import com.universite.notification.service.student.entity.enums.CardRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardRequestDto {
    private Long id;
    private Long studentId;
    private String studentName;
    private LocalDateTime requestDate;
    private CardRequestStatus status;
    private LocalDateTime processedDate;
    private LocalDateTime receivedDate;
    private Long processedById;
    private String processedByName;
}