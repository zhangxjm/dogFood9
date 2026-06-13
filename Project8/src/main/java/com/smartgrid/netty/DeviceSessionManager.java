package com.smartgrid.netty;

import io.netty.channel.Channel;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class DeviceSessionManager {

    private final ConcurrentHashMap<String, Channel> deviceChannels = new ConcurrentHashMap<>();

    public void register(String deviceId, Channel channel) {
        Channel existing = deviceChannels.put(deviceId, channel);
        if (existing != null && existing.isActive()) {
            existing.close();
        }
    }

    public void unregister(String deviceId) {
        deviceChannels.remove(deviceId);
    }

    public Channel getChannel(String deviceId) {
        return deviceChannels.get(deviceId);
    }

    public boolean isOnline(String deviceId) {
        Channel channel = deviceChannels.get(deviceId);
        return channel != null && channel.isActive();
    }

    public Set<String> getOnlineDeviceIds() {
        return Collections.unmodifiableSet(deviceChannels.keySet());
    }

    public int getOnlineCount() {
        return deviceChannels.size();
    }
}
