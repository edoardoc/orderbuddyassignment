import {
  WebSocketGateway,
  OnGatewayConnection,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { EventsService } from './events.service';
import { Logger } from '@nestjs/common';
import {
  JoinStoreDto,
  JoinDisplayDto,
  OrderItemStartedDto,
  OrderPickupDto,
  OrderCompletedDto,
  UpdateOrderWaitTimeDto,
  OrderItemCompletedDto,
  OrderSubmittedDto,
  JoinOrderDto,
  JoinStationDto,
} from './dtos/events.gateway.dto';
import * as dotenv from 'dotenv'; // Change import statement
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

dotenv.config();

class Events {
  static readonly STORE_JOINED = 'store_joined';
}
@WebSocketGateway({
  cors: {
    origin: [process.env.STORE_ENDPOINT, process.env.MENU_ENDPOINT],
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Socket;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private readonly eventsService: EventsService,
    @InjectPinoLogger(EventsGateway.name) private readonly traceLogger: PinoLogger
  ) {}

  handleConnection(socket: Socket): void {
    this.traceLogger.trace(
      {
        module: 'websocket',
        event: 'connection',
        clientId: socket.id,
        ip: socket.handshake.address,
      },
      'Client connected'
    );
    this.logger.debug(`${socket.id} connected`);

    socket.on('disconnect', () => {
      this.logger.debug(`${socket.id} disconnected`);
    });
  }

  @SubscribeMessage('order_received')
  onOrderReceived(@MessageBody() data: OrderSubmittedDto): void {
    if (!data.restaurantId || !data.locationId) {
      this.logger.error('Restaurant ID or Location ID is missing from order received event');
      return;
    }

    const locationRoom = `${data.restaurantId}_${data.locationId}`;
    this.server.to(locationRoom).emit('order_received', data);

    this.traceLogger.trace(
      {
        module: 'websocket',
        event: 'order_received',
        restaurantId: data.restaurantId,
        locationId: data.locationId,
        orderId: data.orderId,
      },
      'Order received event emitted to location room'
    );
  }

  @SubscribeMessage('store_joined')
  onStoreJoined(@ConnectedSocket() socket: Socket, @MessageBody() data: JoinStoreDto): void {
    this.eventsService.join(socket, data.restaurantId);
    const locationRoom = `${data.restaurantId}_${data.locationId}`;
    this.eventsService.join(socket, locationRoom);
    this.logger.debug(`Store joined restaurant ${data.restaurantId} and location ${data.locationId}`);
  }

  // @SubscribeMessage('order_joined')
  // onOrderJoined(@ConnectedSocket() socket: Socket, @MessageBody() data: JoinOrderDto): void {
  //   this.eventsService.join(socket, data.orderId)
  // }
  @SubscribeMessage('order_joined')
  async handleOrderJoined(
    @MessageBody()
    data: {
      orderId: string;
      restaurantId: string;
      locationId: string;
      stationTags: string[];
      correlationId: string;
    },
    @ConnectedSocket() client?: Socket // Make socket optional since it might be called directly
  ) {
    try {
      this.traceLogger.trace(
        {
          module: 'websocket',
          event: 'order_joined',
          correlationId: data.correlationId,
          orderId: data.orderId,
          restaurantId: data.restaurantId,
        },
        'Order joined to WebSocket room'
      );
      // Add client to room for this specific order
      // client.join(data.orderId)
      if (client) {
        client.join(data.orderId);
      }

      // Get all connected stations that match the tags
      const stations = await this.eventsService.getStationsByTags(data.restaurantId, data.locationId, data.stationTags);
      this.traceLogger.trace(
        {
          module: 'websocket',
          event: 'stations_found',
          correlationId: data.correlationId,
          orderId: data.orderId,
          stationCount: stations.length,
        },
        `Found ${stations.length} matching stations`
      );
      this.logger.debug(`Found ${stations.length} matching stations for location ${data.locationId}`);
      // Emit to matching stations
      stations.forEach((station) => {
        this.server.to(station.id).emit('new_order', {
          orderId: data.orderId,
          stationTags: station.stationTags,
          locationId: data.locationId,
          correlationId: data.correlationId, // Pass correlationId to client
        });
        this.traceLogger.trace(
          {
            module: 'websocket',
            event: 'order_routed',
            correlationId: data.correlationId,
            orderId: data.orderId,
            stationId: station.id,
          },
          'Order routed to station'
        );
      });

      // Confirm routing
    } catch (error) {
      console.error('Error routing order:', error);
      this.logger.error(
        {
          module: 'websocket',
          event: 'order_routing_failed',
          correlationId: data.correlationId,
          orderId: data.orderId,
          error: error.message,
          stack: error.stack,
        },
        'Failed to route order'
      );
    }
  }

  // @SubscribeMessage('display_joined')
  // onDisplayJoined(@ConnectedSocket() socket: Socket, @MessageBody() data: JoinDisplayDto): void {
  //   this.eventsService.join(socket, data.displayId)
  // }

  @SubscribeMessage('station_joined')
  handleStationJoined(
    @MessageBody()
    data: {
      restaurantId: string;
      locationId: string;
      stationId: string;
      stationTags: string[];
    },
    @ConnectedSocket() client: Socket
  ) {
    // Add station to room
    this.logger.debug(`Station joining: ${JSON.stringify(data)}`);

    client.join(data.stationId);
    client.join(`${data.restaurantId}_${data.locationId}`);

    // Store station info
    this.eventsService.addStation({
      id: data.stationId,
      restaurantId: data.restaurantId,
      locationId: data.locationId,
      stationTags: data.stationTags,
    });

    client.emit('station_connected', {
      success: true,
      stationId: data.stationId,
      locationId: data.locationId, // Add locationId to response
    });
  }

  @SubscribeMessage('order_item_started')
  async onOrderItemStarted(@ConnectedSocket() socket: Socket, @MessageBody() data: OrderItemStartedDto): Promise<void> {
    try {
      const stations = await this.eventsService.getStationsByTags(data.restaurantId, data.locationId, data.stationTags);

      this.logger.debug(`Found ${stations.length} matching stations for tags: ${data.stationTags}`);

      stations.forEach((station) => {
        this.eventsService.broadcast(socket, 'order_item_started', station.id, {
          orderId: data.orderId,
          itemId: data.itemId,
          restaurantId: data.restaurantId,
          locationId: data.locationId,
          stationId: station.id,
          stationTags: station.stationTags,
        });
      });

      // this.eventsService.broadcast(socket, 'dashboard_order_item_started', data.restaurantId, {
      //   orderId: data.orderId,
      //   itemId: data.itemId,
      //   restaurantId: data.restaurantId,
      //   locationId: data.locationId,
      // });
      const locationRoom = `${data.restaurantId}_${data.locationId}`;
      this.eventsService.broadcast(socket, 'dashboard_order_item_started', locationRoom, {
        orderId: data.orderId,
        itemId: data.itemId,
        restaurantId: data.restaurantId,
        locationId: data.locationId,
      });
    } catch (error) {
      this.logger.error('Error broadcasting order_item_started:', error);
    }
  }
  @SubscribeMessage('order_ready_for_pickup')
  onOrderReadyForPickup(@ConnectedSocket() socket: Socket, @MessageBody() data: OrderPickupDto): void {
    console.log('order_ready_for_pickup', data);
    this.eventsService.broadcast(socket, 'order_ready_for_pickup', data.restaurantId, data);
    this.eventsService.broadcast(socket, 'order_ready_for_pickup', data.orderId, data);
  }

  @SubscribeMessage('order_completed')
  orderCompleted(@ConnectedSocket() socket: Socket, @MessageBody() data: OrderCompletedDto): void {
    this.eventsService.broadcast(socket, 'order_completed', data.restaurantId, data);
    this.eventsService.broadcast(socket, 'order_completed', data.orderId, data);
  }

  @SubscribeMessage('order_wait_time_updated')
  updateOrderWaitTime(@ConnectedSocket() socket: Socket, @MessageBody() data: UpdateOrderWaitTimeDto): void {
    this.eventsService.broadcast(socket, 'order_wait_time_updated', data.restaurantId, data);
    this.eventsService.broadcast(socket, 'order_wait_time_updated', data.orderId, data);
  }

  @SubscribeMessage('order_item_completed')
  async orderItemCompleted(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: OrderItemCompletedDto
  ): Promise<void> {
    try {
      const stations = await this.eventsService.getStationsByTags(data.restaurantId, data.locationId, data.stationTags);

      this.logger.debug(`Found ${stations.length} matching stations for tags: ${data.stationTags}`);

      stations.forEach((station) => {
        this.eventsService.broadcast(socket, 'order_item_completed', station.id, {
          orderId: data.orderId,
          itemId: data.itemId,
          restaurantId: data.restaurantId,
          locationId: data.locationId,
          stationId: station.id,
          stationTags: station.stationTags,
        });
      });

      // this.eventsService.broadcast(socket, 'dashboard_order_item_completed', data.restaurantId, {
      //   orderId: data.orderId,
      //   itemId: data.itemId,
      //   restaurantId: data.restaurantId,
      //   locationId: data.locationId,
      // });
      const locationRoom = `${data.restaurantId}_${data.locationId}`;
      this.eventsService.broadcast(socket, 'dashboard_order_item_completed', locationRoom, {
        orderId: data.orderId,
        itemId: data.itemId,
        restaurantId: data.restaurantId,
        locationId: data.locationId,
      });
    } catch (error) {
      this.logger.error('Error broadcasting order_item_completed:', error);
    }
  }
}
