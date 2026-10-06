type LogFields = Record<string, unknown>;

function timestamp(): string {
  return new Date(Date.now()).toISOString();
}

export const logger = {
  info(event: string, fields: LogFields = {}): void {
    console.info(event, { timestamp: timestamp(), ...fields });
  },
  warn(event: string, fields: LogFields = {}): void {
    console.warn(event, { timestamp: timestamp(), ...fields });
  },
  error(event: string, fields: LogFields = {}): void {
    console.error(event, { timestamp: timestamp(), ...fields });
  },
};

export type Logger = typeof logger;
