package com.fraudguard.repository;

import com.fraudguard.entity.Blacklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlacklistRepository extends JpaRepository<Blacklist, Long> {

    Optional<Blacklist> findByBlacklistTypeAndBlacklistValue(String blacklistType, String blacklistValue);

    List<Blacklist> findByBlacklistType(String blacklistType);

    List<Blacklist> findByEnabledTrue();

    List<Blacklist> findByEnabledTrueAndBlacklistType(String blacklistType);

    boolean existsByBlacklistTypeAndBlacklistValueAndEnabledTrue(String blacklistType, String blacklistValue);

    long countByEnabledTrue();
}
