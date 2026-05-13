export type NotifyLevel = 'debug' | 'info' | 'success' | 'warning' | 'error';

export type NotifyPayload = {
  title: string;
  message: string;
  level: NotifyLevel;
  timestamp: string;
  meta?: Record<string, unknown>;
};

export type ChannelResult =
  | {
      channel: string;
      status: 'sent';
      detail?: string;
    }
  | {
      channel: string;
      status: 'skipped';
      reason: string;
    }
  | {
      channel: string;
      status: 'failed';
      error: string;
    };

export type NotifyChannel = {
  name: string;
  requiredEnv: string[];
  isConfigured: () => boolean;
  send: (payload: NotifyPayload) => Promise<ChannelResult>;
};
