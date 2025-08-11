import { Module, Provider } from '@nestjs/common';
import { EmailService } from './email.service';
import { LocalEmailService } from './local-email.service';
import { EmailTemplateService } from './email-template.service';
import { EmailController } from './email.controller';

export const EMAIL_SENDER = 'EMAIL_SENDER';

const EmailSenderProvider: Provider = {
  provide: EMAIL_SENDER,
  useClass: process.env.NODE_ENV === 'production' ? EmailService : LocalEmailService,
};

@Module({
  controllers: [EmailController],
  providers: [EmailService, LocalEmailService, EmailSenderProvider, EmailTemplateService],
  exports: [EMAIL_SENDER, EmailTemplateService],
})
export class EmailModule {}
