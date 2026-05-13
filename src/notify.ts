import { discordChannel } from './channels/discord.js';
import { emailChannel } from './channels/email.js';
import { genericWebhookChannel } from './channels/webhook.js';
import { slackChannel } from './channels/slack.js';
import { telegramChannel } from './channels/telegram.js';
import { twilioSmsChannel } from './channels/twilio.js';
import type { ChannelResult, NotifyChannel, NotifyPayload } from './types.js';

export function defaultChannels(): NotifyChannel[] {
  return [
    emailChannel(),
    slackChannel(),
    discordChannel(),
    telegramChannel(),
    twilioSmsChannel(),
    genericWebhookChannel(),
  ];
}

export async function sendToConfiguredChannels(
  payload: NotifyPayload,
  channels = defaultChannels(),
): Promise<ChannelResult[]> {
  const tasks = channels.map(async (channel) => {
    try {
      if (!channel.isConfigured()) {
        return channel.send(payload);
      }

      return await channel.send(payload);
    } catch (error) {
      return {
        channel: channel.name,
        status: 'failed' as const,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  return Promise.all(tasks);
}
