package com.techtammina.crm.repository;

import com.techtammina.crm.entity.QueueMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QueueMemberRepository extends JpaRepository<QueueMember, Integer> {
    
    List<QueueMember> findByQueueQueueId(Integer queueId);
    
    List<QueueMember> findByUserUserId(Integer userId);
    
    @Query("SELECT qm FROM QueueMember qm WHERE qm.queue.queueId = :queueId AND qm.user.userId = :userId")
    QueueMember findByQueueIdAndUserId(@Param("queueId") Integer queueId, @Param("userId") Integer userId);
}

