package com.smartgrid.netty;

import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.LengthFieldBasedFrameDecoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

@Component
public class GridNettyServer {

    private static final Logger log = LoggerFactory.getLogger(GridNettyServer.class);

    @Value("${netty.server.port:9090}")
    private int port;

    private EventLoopGroup bossGroup;
    private EventLoopGroup workerGroup;

    private final GridServerHandler gridServerHandler;

    public GridNettyServer(GridServerHandler gridServerHandler) {
        this.gridServerHandler = gridServerHandler;
    }

    @PostConstruct
    public void start() {
        new Thread(() -> {
            bossGroup = new NioEventLoopGroup(1);
            workerGroup = new NioEventLoopGroup(4);

            ServerBootstrap bootstrap = new ServerBootstrap();
            bootstrap.group(bossGroup, workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .option(ChannelOption.SO_BACKLOG, 128)
                    .childOption(ChannelOption.SO_KEEPALIVE, true)
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) {
                            ch.pipeline()
                                    .addLast(new LengthFieldBasedFrameDecoder(1048576, 0, 4, 0, 4))
                                    .addLast(new ProtobufDecoder())
                                    .addLast(new ProtobufEncoder())
                                    .addLast(gridServerHandler);
                        }
                    });

            try {
                bootstrap.bind(port).sync();
                log.info("Netty server started on port {}", port);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("Netty server start interrupted", e);
            }
        }, "netty-server").start();
    }

    @PreDestroy
    public void stop() {
        if (workerGroup != null) {
            workerGroup.shutdownGracefully();
        }
        if (bossGroup != null) {
            bossGroup.shutdownGracefully();
        }
        log.info("Netty server shut down");
    }

    public GridServerHandler getHandler() {
        return gridServerHandler;
    }
}
