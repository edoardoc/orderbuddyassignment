import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string; // optional override
}

@Injectable()
export class LocalEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      secure: false, // Mailpit doesn't require SSL
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async send(options: SendEmailOptions): Promise<void> {
    const { to, subject, html, from = 'noreply@orderbuddy.test' } = options;

    await this.transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
  }
}
