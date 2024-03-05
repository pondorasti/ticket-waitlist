import twilio from 'twilio';
import env from './env';

// https://pushover.net/api
export async function sendPushoverAlert({ message }: { message: string }) {
  if (env.NODE_ENV === 'development') {
    console.log('Skipping push alert in development');
    return;
  }

  if (!env.PUSHOVER_TOKEN || !env.PUSHOVER_USER) {
    console.error(
      'PUSHOVER_TOKEN and PUSHOVER_USER are required to use the Pushover notification service'
    );
    return;
  }

  const formData = new FormData();

  formData.append('token', env.PUSHOVER_TOKEN);
  formData.append('user', env.PUSHOVER_USER);
  formData.append('message', message);
  formData.append('title', 'Ticket Alerts');

  // send push alert with Pushover
  return fetch('https://api.pushover.net/1/messages.json', {
    method: 'POST',
    body: formData,
  }).then((res) => res.json());
}

// note: does not work; needs updated to use the consts
export async function sendTwilioAlert({
  to,
  message,
}: {
  to: string;
  message: string;
}) {
  if (
    !env.TWILIO_ACCOUNT_SID ||
    !env.TWILIO_AUTH_TOKEN ||
    !env.TWILIO_FROM_NUMBER
  ) {
    console.error(
      'TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required to use the Twilio notification service'
    );
    return;
  }

  try {
    const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

    const res = await client.messages.create({
      body: message,
      to,
      from: env.TWILIO_FROM_NUMBER,
    });
    console.log(res);
  } catch (error) {
    console.error(`Error sending message to ${to}: ${error}`);
  }
}

export async function sendPushAlert({
  to,
  mode,
  message,
}: {
  mode: 'sms' | 'pushover';
  message: string;
  to?: string;
}) {
  switch (mode) {
    case 'sms':
      if (!to) {
        console.error('sendPushAlert: to is required for SMS alerts');
        return;
      }
      return sendTwilioAlert({ to, message });
    case 'pushover':
      return sendPushoverAlert({ message });
  }
}
