import { Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string; // optional override
}

@Injectable()
export class EmailService {

  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
   
   
  }

  async send(options: SendEmailOptions): Promise<void> {
     if (!process.env.FROM_EMAIL) {
      throw new Error('FROM_EMAIL is not set in the environment variables');
    }
    const fromEmail = process.env.FROM_EMAIL;
    const { to, subject, html, from = fromEmail } = options;

    try {
      await sgMail.send({ to, from, subject, html });
    } catch (error) {
      // Log the error details but protect sensitive information
      console.error('SendGrid email error:', error.message);
      if (error.response) {
        console.error('SendGrid error details:', error.response.body);
      }
      throw error;
    }
  }
}
