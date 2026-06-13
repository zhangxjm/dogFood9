package com.smartgrid.netty;

import com.smartgrid.rpc.protobuf.GridProtocol;
import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.MessageToByteEncoder;

public class ProtobufEncoder extends MessageToByteEncoder<GridProtocol.GridMessage> {

    @Override
    protected void encode(ChannelHandlerContext ctx, GridProtocol.GridMessage msg, ByteBuf out) throws Exception {
        byte[] bytes = msg.toByteArray();
        out.writeInt(bytes.length);
        out.writeBytes(bytes);
    }
}
