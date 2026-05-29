package com.techtammina.crm.repository;

import com.techtammina.crm.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Integer> {
    List<Task> findByOwner_UserId(Integer userId);
    List<Task> findByCreatedBy_UserId(Integer userId);
    List<Task> findByStatus(Task.Status status);
    List<Task> findByPriority(Task.Priority priority);
    List<Task> findByDueDateBetween(LocalDate start, LocalDate end);

    // Count tasks by executive (owner or created by)
    long countByOwner_UserId(Integer executiveId);

    // Find tasks by owner and created by email
    List<Task> findByOwner_UserIdAndCreatedBy_Email(Integer ownerId, String createdByEmail);

    // Find tasks by owner and status
    List<Task> findByOwner_UserIdAndStatus(Integer ownerId, Task.Status status);

    // Find overdue tasks for executive with minute-level precision
    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.owner LEFT JOIN FETCH t.createdBy WHERE t.owner.userId = :executiveId AND " +
           "((t.dueDate < :today) OR " +
           "(t.dueDate = :today AND t.dueTime IS NOT NULL AND t.dueTime < :currentTime)) AND " +
           "t.status NOT IN ('Completed', 'Cancelled')")
    List<Task> findOverdueTasksByExecutive(@Param("executiveId") Integer executiveId, 
                                          @Param("today") LocalDate today, 
                                          @Param("currentTime") LocalTime currentTime);
    
    // Optimized query to get all tasks for an executive with user data in one query
    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.owner LEFT JOIN FETCH t.createdBy WHERE t.owner.userId = :executiveId ORDER BY t.priority DESC, t.dueDate ASC, t.createdAt ASC")
    List<Task> findByOwnerWithUsers(@Param("executiveId") Integer executiveId);
    
    // Optimized query to get tasks created by a manager with user data fetched to avoid N+1 issues
    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.owner LEFT JOIN FETCH t.createdBy WHERE t.createdBy.userId = :managerId ORDER BY t.priority DESC, t.dueDate ASC, t.createdAt ASC")
    List<Task> findByCreatedByWithUsers(@Param("managerId") Integer managerId);

    // Ultra-optimized query for manager assigned tasks using native SQL
    @Query(value = "SELECT t.task_id, t.title, t.description, t.status, t.priority, t.due_date, t.due_time, " +
                   "t.created_at, t.updated_at, t.remarks, t.document_name, " +
                   "o.user_id as owner_id, o.username as owner_name, o.email as owner_email, " +
                   "c.user_id as created_by_id, c.username as created_by_name, c.email as created_by_email, " +
                   "t.document_sizes, t.document_uploaded_at " +
                   "FROM tasks t " +
                   "LEFT JOIN users o ON t.assigned_to = o.user_id " +
                   "LEFT JOIN users c ON t.created_by = c.user_id " +
                   "WHERE t.created_by = :managerId " +
                   "ORDER BY FIELD(t.priority, 'High', 'Medium', 'Low', 'Backlog'), t.due_date ASC, t.created_at ASC", 
           nativeQuery = true)
    List<Object[]> findTasksByManagerOptimized(@Param("managerId") Integer managerId);
    
    // Ultra-optimized query for categorized tasks - single query with all data
    @Query(value = "SELECT t.task_id, t.title, t.description, t.status, t.priority, t.due_date, t.due_time, " +
                   "t.created_at, t.updated_at, t.remarks, t.document_name, " +
                   "o.user_id as owner_id, o.username as owner_name, o.email as owner_email, " +
                   "c.user_id as created_by_id, c.username as created_by_name, c.email as created_by_email, " +
                   "t.document_sizes, t.document_uploaded_at " +
                   "FROM tasks t " +
                   "LEFT JOIN users o ON t.assigned_to = o.user_id " +
                   "LEFT JOIN users c ON t.created_by = c.user_id " +
                   "WHERE t.assigned_to = :executiveId " +
                   "ORDER BY FIELD(t.priority, 'High', 'Medium', 'Low', 'Backlog'), t.due_date ASC, t.created_at ASC", 
           nativeQuery = true)
    List<Object[]> findTasksForExecutiveOptimized(@Param("executiveId") Integer executiveId);
    
    // Get tasks by owner and status with user data fetched
    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.owner LEFT JOIN FETCH t.createdBy WHERE t.owner.userId = :ownerId AND t.status = :status")
    List<Task> findByOwnerAndStatusWithUsers(@Param("ownerId") Integer ownerId, @Param("status") Task.Status status);
    
    // Find all overdue tasks (past due date or past due time today)
    @Query("SELECT t FROM Task t WHERE ((t.dueDate < :today) OR (t.dueDate = :today AND t.dueTime IS NOT NULL AND t.dueTime < :currentTime)) AND (t.status = 'Pending' OR t.status = 'In_Progress')")
    List<Task> findOverdueTasks(@Param("today") LocalDate today, @Param("currentTime") java.time.LocalTime currentTime);
    
    // Find task by ID with explicit join fetch for user relationships
    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.owner LEFT JOIN FETCH t.createdBy WHERE t.taskId = :id")
    Task findByIdWithUsers(@Param("id") Integer id);
    
    // For data reassignment
    List<Task> findByOwner(com.techtammina.crm.entity.Users user);
    List<Task> findByCreatedBy(com.techtammina.crm.entity.Users user);
}

