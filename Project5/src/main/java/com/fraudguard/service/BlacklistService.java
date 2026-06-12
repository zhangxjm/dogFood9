package com.fraudguard.service;

import com.fraudguard.entity.Blacklist;

import java.util.List;
import java.util.Optional;

public interface BlacklistService {

    Blacklist addToBlacklist(String type, String value, String description, String riskLevel, String source);

    boolean removeFromBlacklist(String type, String value);

    boolean isBlacklisted(String type, String value);

    List<Blacklist> getBlacklistByType(String type);

    List<Blacklist> getAllBlacklist();

    boolean checkIp(String ip);

    boolean checkCard(String cardNumber);

    boolean checkAccount(String account);

    boolean checkUser(String userId);

    long getBlacklistCount();
}
