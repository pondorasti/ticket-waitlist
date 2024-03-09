import twilio from 'twilio';
import env from './env';

// https://pushover.net/api
export async function sendPushoverAlert({ message }: { message: string }) {
  if (env.NODE_ENV === 'development') {
    console.log(message);
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

  return fetch('https://api.pushover.net/1/messages.json', {
    method: 'POST',
    body: formData,
  }).then((res) => res.json());
}

export async function sendTwilioAlert({ message }: { message: string }) {
  if (
    !env.TWILIO_ACCOUNT_SID ||
    !env.TWILIO_AUTH_TOKEN ||
    !env.TWILIO_FROM_NUMBER ||
    !env.TWILIO_TO_NUMBER
  ) {
    console.error(
      'TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required to use the Twilio notification service'
    );
    return;
  }

  if (env.NODE_ENV === 'development') {
    console.log(message);
    return;
  }

  try {
    const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

    return await client.messages.create({
      body: message,
      to: env.TWILIO_TO_NUMBER,
      from: env.TWILIO_FROM_NUMBER,
    });
  } catch (error) {
    console.error(`Error sending message to ${env.TWILIO_TO_NUMBER}: ${error}`);
  }
}

export async function sendPushAlert({
  mode,
  message,
}: {
  mode: 'sms' | 'pushover';
  message: string;
}) {
  switch (mode) {
    case 'sms':
      return sendTwilioAlert({ message });
    case 'pushover':
      return sendPushoverAlert({ message });
  }
}
