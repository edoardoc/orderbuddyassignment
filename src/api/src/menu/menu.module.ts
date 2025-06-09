import { Module } from '@nestjs/common'
import { MenuController } from './menu.controller'
import { MenuService } from './menu.service'
import { EventsModule } from '../events/events.module'
import { WebPushModule } from '../web-push/web-push.module'
// import { EventsGateway } from '../events/events.gateway'
// import { EventsService } from '../events/events.service'
// import { EventsModule } from '../events/events.module'
// import { WebPushModule } from '../web-push/web-push.module'

@Module({
  // imports: [EventsModule, WebPushModule],
  // providers: [MenuService, EventsGateway, EventsService, EventsModule],
  // controllers: [MenuController],
  // exports: [MenuService],

  imports: [EventsModule, WebPushModule],
  providers: [MenuService],
  controllers: [MenuController],
  exports: [MenuService],
})
export class MenuModule {}
