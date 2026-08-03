import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderItemStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/kds' })
export class KdsGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly prisma: PrismaService) {}

  afterInit() {
    console.log('⚡ KDS WebSockets Gateway Initialized');
  }

  @OnEvent('order.placed')
  handleOrderPlacedEvent(payload: any) {
    this.server.emit('kds:order_placed', payload);
  }

  @OnEvent('order.voided')
  handleOrderVoidedEvent(eventData: any) {
    this.server.emit('kds:order_voided', eventData.payload);
  }

  @OnEvent('order.items_appended')
  handleOrderItemsAppendedEvent(eventData: any) {
    this.server.emit('kds:items_appended', eventData.payload);
  }

  @SubscribeMessage('kds:bump_item')
  async handleBumpItem(
    @MessageBody() data: { orderItemId: string; status: OrderItemStatus },
    @ConnectedSocket() client: Socket
  ) {
    const updated = await this.prisma.orderItem.update({
      where: { id: data.orderItemId },
      data: { status: data.status },
      include: { menuItem: true, order: true }
    });

    this.server.emit('kds:item_updated', {
      orderItemId: updated.id,
      orderId: updated.orderId,
      status: updated.status,
      station: updated.station
    });

    return { success: true, updated };
  }
}
