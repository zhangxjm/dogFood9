package com.smartgrid.netty;

import com.smartgrid.entity.GridDevice;
import com.smartgrid.repository.GridDeviceRepository;
import com.smartgrid.rpc.protobuf.GridProtocol;
import io.netty.channel.Channel;
import io.netty.channel.ChannelHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

@Component
@ChannelHandler.Sharable
public class GridServerHandler extends SimpleChannelInboundHandler<GridProtocol.GridMessage> {

    private static final Logger log = LoggerFactory.getLogger(GridServerHandler.class);

    private final ConcurrentHashMap<String, String> channelDeviceMap = new ConcurrentHashMap<>();

    private final GridDeviceRepository deviceRepository;
    private final SimulateDeviceService simulateDeviceService;
    private final DeviceSessionManager sessionManager;

    public GridServerHandler(GridDeviceRepository deviceRepository,
                             SimulateDeviceService simulateDeviceService,
                             DeviceSessionManager sessionManager) {
        this.deviceRepository = deviceRepository;
        this.simulateDeviceService = simulateDeviceService;
        this.sessionManager = sessionManager;
    }

    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        log.info("Device connected: {}", ctx.channel().id().asLongText());
        super.channelActive(ctx);
    }

    @Override
    public void channelInactive(ChannelHandlerContext ctx) throws Exception {
        String channelId = ctx.channel().id().asLongText();
        String deviceId = channelDeviceMap.remove(channelId);
        if (deviceId != null) {
            sessionManager.unregister(deviceId);
            log.info("Device disconnected: deviceId={}, channelId={}", deviceId, channelId);
        }
        super.channelInactive(ctx);
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, GridProtocol.GridMessage msg) throws Exception {
        String deviceId = msg.getDeviceId();
        String channelId = ctx.channel().id().asLongText();

        if (!channelDeviceMap.containsKey(channelId)) {
            channelDeviceMap.put(channelId, deviceId);
            sessionManager.register(deviceId, ctx.channel());
        }

        switch (msg.getType()) {
            case HEARTBEAT:
                handleHeartbeat(deviceId, msg);
                break;
            case STATUS_REPORT:
                handleStatusReport(deviceId, msg);
                break;
            case ALARM:
                handleAlarm(deviceId, msg);
                break;
            default:
                break;
        }
    }

    private void handleHeartbeat(String deviceId, GridProtocol.GridMessage msg) {
        deviceRepository.findByDeviceId(deviceId).ifPresent(device -> {
            device.setStatus(msg.getHeartbeat().getStatus().name());
            device.setLastHeartbeat(LocalDateTime.now());
            deviceRepository.save(device);
        });
        log.debug("Heartbeat from device: {}", deviceId);
    }

    private void handleStatusReport(String deviceId, GridProtocol.GridMessage msg) {
        GridProtocol.StatusReportPayload status = msg.getStatusReport();
        deviceRepository.findByDeviceId(deviceId).ifPresent(device -> {
            device.setStatus(status.getDeviceStatus().name());
            device.setCurrentVoltage(status.getVoltageA());
            device.setCurrentActivePower(status.getActivePower());
            device.setCurrentReactivePower(status.getReactivePower());
            device.setPowerFactor(status.getPowerFactor());
            device.setFrequency(status.getFrequency());
            device.setTemperature(status.getTemperature());
            device.setCompensationCapacity(status.getCompensationCapacity());
            device.setLoadRate(status.getLoadRate());
            device.setLastHeartbeat(LocalDateTime.now());
            deviceRepository.save(device);
        });
        log.debug("Status report from device: {}", deviceId);
    }

    private void handleAlarm(String deviceId, GridProtocol.GridMessage msg) {
        GridProtocol.AlarmPayload alarm = msg.getAlarm();
        log.warn("Alarm from device {}: level={}, source={}, message={}",
                deviceId, alarm.getLevel(), alarm.getAlarmSource(), alarm.getAlarmMessage());
        deviceRepository.findByDeviceId(deviceId).ifPresent(device -> {
            if (alarm.getLevel() == GridProtocol.AlarmLevel.EMERGENCY
                    || alarm.getLevel() == GridProtocol.AlarmLevel.CRITICAL) {
                device.setStatus("FAULT");
                deviceRepository.save(device);
            }
        });
    }

    public void sendCommand(String deviceId, GridProtocol.GridMessage msg) {
        Channel channel = sessionManager.getChannel(deviceId);
        if (channel != null && channel.isActive()) {
            channel.writeAndFlush(msg);
        } else {
            log.warn("Device {} is not online, cannot send command", deviceId);
        }
    }
}
