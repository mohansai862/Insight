package com.techtammina.crm.repository;

import com.techtammina.crm.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByUser_UserIdAndIsClearedFalseOrderByCreatedAtDesc(Integer userId);
    List<Notification> findByUser_UserIdAndIsReadFalseAndIsClearedFalseOrderByCreatedAtDesc(Integer userId);
    long countByUser_UserIdAndIsReadFalseAndIsClearedFalse(Integer userId);
    List<Notification> findByTypeAndMessageContaining(String type, String messageContent);
    List<Notification> findByUser_UserIdAndTypeAndMessage(Integer userId, String type, String message);
    List<Notification> findByUser_UserIdAndTypeAndMessageContaining(Integer userId, String type, String messageContent);
    long countByUser_UserIdAndTaskTaskIdAndType(Integer userId, Integer taskId, String type);
    
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM Notification n WHERE n.type = :type AND n.message LIKE CONCAT('%', :messagePattern, '%')")
    void deleteByTypeAndMessageContaining(@org.springframework.data.repository.query.Param("type") String type, @org.springframework.data.repository.query.Param("messagePattern") String messagePattern);
    
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Notification n SET n.isCleared = true WHERE n.user.userId = :userId")
    void markAllAsClearedByUserId(@org.springframework.data.repository.query.Param("userId") Integer userId);
}

