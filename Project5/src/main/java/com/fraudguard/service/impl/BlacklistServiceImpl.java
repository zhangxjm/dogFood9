package com.fraudguard.service.impl;

import com.fraudguard.entity.Blacklist;
import com.fraudguard.repository.BlacklistRepository;
import com.fraudguard.service.BlacklistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BlacklistServiceImpl implements BlacklistService {

    private final BlacklistRepository blacklistRepository;

    @Override
    @Transactional
    @CacheEvict(value = "blacklist", allEntries = true)
    public Blacklist addToBlacklist(String type, String value, String description,
                                     String riskLevel, String source) {
        Blacklist blacklist = new Blacklist();
        blacklist.setBlacklistType(type);
        blacklist.setBlacklistValue(value);
        blacklist.setDescription(description);
        blacklist.setRiskLevel(riskLevel);
        blacklist.setSource(source);
        blacklist.setEnabled(true);
        blacklist.setCreatedBy("SYSTEM");

        blacklist = blacklistRepository.save(blacklist);
        log.info("Added to blacklist: type={}, value={}", type, value);
        return blacklist;
    }

    @Override
    @Transactional
    @CacheEvict(value = "blacklist", allEntries = true)
    public boolean removeFromBlacklist(String type, String value) {
        return blacklistRepository.findByBlacklistTypeAndBlacklistValue(type, value)
            .map(blacklist -> {
                blacklist.setEnabled(false);
                blacklist.setExpiresAt(LocalDateTime.now());
                blacklistRepository.save(blacklist);
                log.info("Removed from blacklist: type={}, value={}", type, value);
                return true;
            }).orElse(false);
    }

    @Override
    @Cacheable(value = "blacklist", key = "#type + ':' + #value")
    public boolean isBlacklisted(String type, String value) {
        return blacklistRepository.existsByBlacklistTypeAndBlacklistValueAndEnabledTrue(type, value);
    }

    @Override
    public List<Blacklist> getBlacklistByType(String type) {
        return blacklistRepository.findByEnabledTrueAndBlacklistType(type);
    }

    @Override
    public List<Blacklist> getAllBlacklist() {
        return blacklistRepository.findByEnabledTrue();
    }

    @Override
    public boolean checkIp(String ip) {
        return isBlacklisted("IP", ip);
    }

    @Override
    public boolean checkCard(String cardNumber) {
        return isBlacklisted("CARD", cardNumber);
    }

    @Override
    public boolean checkAccount(String account) {
        return isBlacklisted("ACCOUNT", account);
    }

    @Override
    public boolean checkUser(String userId) {
        return isBlacklisted("USER", userId);
    }

    @Override
    public long getBlacklistCount() {
        return blacklistRepository.countByEnabledTrue();
    }
}
