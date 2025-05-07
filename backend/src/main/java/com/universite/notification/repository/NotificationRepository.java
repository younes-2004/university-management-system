package com.universite.notification.repository;

import com.universite.auth.entity.User;
import com.universite.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Récupère toutes les notifications d'un utilisateur, triées par date de création décroissante
     * @param user L'utilisateur dont on veut récupérer les notifications
     * @return Liste des notifications de l'utilisateur, triées par date de création (plus récentes d'abord)
     */
    List<Notification> findByUserOrderByDateCreationDesc(User user);
}