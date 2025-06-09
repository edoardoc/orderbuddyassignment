import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class EventsService {
  private logger = new Logger(EventsService.name);

  join(socket: Socket, roomId: string): void {
    socket.join(roomId);
    console.log(`socket ${socket.id} joined room ${roomId}`);
    this.logger.debug(`${socket.id} joined room :${roomId}]`);
  }

  broadcast(socket: Socket, event: string, toRoomId: string, data: any): void {
    socket.broadcast.to(toRoomId).emit(event, data);
    console.log(`broadcasting event ${event} to room ${toRoomId}`);
    this.logger.debug(`broadcasting event ${event} to room ${toRoomId}`);
  }

  private stations = new Map<
    string,
    {
      id: string;
      restaurantId: string;
      locationId: string;
      stationTags: string[];
    }
  >();

  addStation(station: { id: string; restaurantId: string; locationId: string; stationTags: string[] }) {
    this.logger.debug('Current stations:');
    this.stations.set(station.id, station);
  }

  getStationsByTags(restaurantId: string, locationId: string, tags: string[]) {
    this.logger.debug(
      `Finding stations for restaurant=${restaurantId}, location=${locationId}, tags=${tags.join(',')}`
    );

    const stations = Array.from(this.stations.values());

    const matchingStations = stations.filter((station) => {
      const isMatchingRestaurant = station.restaurantId === restaurantId;
      const isMatchingLocation = station.locationId === locationId;
      const hasMatchingTags = station.stationTags.some((tag) => tags.includes(tag));

      this.logger.debug(
        `Station ${station.id} check:`,
        `\n - Restaurant: ${isMatchingRestaurant} (${station.restaurantId})`,
        `\n - Location: ${isMatchingLocation} (${station.locationId})`,
        `\n - Tags: ${hasMatchingTags} (${station.stationTags})`
      );

      return isMatchingRestaurant && isMatchingLocation && hasMatchingTags;
    });

    this.logger.debug(`Found ${matchingStations.length} matching stations for location ${locationId}`);

    return matchingStations;
  }
}
