import got from 'got';
import * as FormData from 'form-data';
import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { EmailVar, MailModuleOptions } from './mail.interfaces';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {}

  async sendEmail(
    subject: string,
    template: string,
    emailVars: EmailVar[],
  ): Promise<boolean> {
    const form = new FormData();
    form.append(
      'from',
      `Rishabh from HotWheels <mailgun@${this.options.domain}>`,
    );
    form.append('to', `hotwheelswebapp2@gmail.com`);
    form.append('subject', subject);
    form.append('template', template);
    emailVars.forEach((eVar) => form.append(`v:${eVar.key}`, eVar.value));
    try {
      await got.post(
        `https://api.mailgun.net/v3/${this.options.domain}/messages`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `api:${this.options.apiKey}`,
            ).toString('base64')}`,
          },
          body: form,
        },
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  sendVerificationEmail(email: string, code: string) {
    this.sendEmail('Verify Your Email', 'verify-email', [
      { key: 'code', value: code },
      { key: 'username', value: email },
    ]);
  }

  sendOtpEmail(email: string, code: string) {
    this.sendEmail(`OTP: ${code}`, 'verify-email', [
      { key: 'code', value: code },
      { key: 'username', value: email },
    ]);
  }

  sendDeliveryEmail(email: string) {
    this.sendEmail('Order Delivered', 'verify-email-test-2', [
      // { key: 'code', value: code },
      { key: 'username', value: email },
    ]);
  }

  sendPackedEmail(email: string) {
    this.sendEmail('Order Packed:Come Pick Your Order', 'verify-email-test-2', [
      // { key: 'code', value: code },
      { key: 'username', value: email },
    ]);
  }

  sendFeedbackEmail(email: string) {
    this.sendEmail(
      'Please Provide Feedback For The Last Order',
      'verify-email-test-2',
      [
        // { key: 'code', value: code },
        { key: 'username', value: email },
      ],
    );
  }
}
