import { createClient } from 'redis';

// Stream keys for shared streams
const POSITION_STREAM = 'sputniks:positions:stream';
const EVENTS_STREAM = 'sputniks:events:stream';
const COMMANDS_STREAM = 'sputniks:commands:stream';
const MAX_STREAM_LENGTH = 1000;

// Get the user's Sputnik UUID from environment variable or generate a default
export const getSputnikUuid = (): string => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_SPUTNIK_UUID || 'default-sputnik';
  }
  return process.env.SPUTNIK_UUID || 'default-sputnik';
};

export class RedisStreams {
  private redis: ReturnType<typeof createClient>;
  private static instance: RedisStreams;

  private constructor() {
    this.redis = createClient({ url: process.env.REDIS_URL });
  }

  static async getInstance(): Promise<RedisStreams> {
    if (!RedisStreams.instance) {
      RedisStreams.instance = new RedisStreams();
      await RedisStreams.instance.connect();
    }
    return RedisStreams.instance;
  }

  private async connect() {
    if (!this.redis.isOpen) {
      await this.redis.connect();
    }
  }

  // Get Redis key for a specific Sputnik's state
  getStateKey(uuid: string): string {
    return `sputnik:${uuid}:state`;
  }

  // Publish position update to stream with UUID
  async publishPosition(uuid: string, position: any): Promise<string> {
    // Include the UUID in the position data
    const positionWithUuid = {
      ...position,
      uuid
    };

    return await this.redis.xAdd(
      POSITION_STREAM,
      '*',
      { data: JSON.stringify(positionWithUuid), timestamp: Date.now().toString() },
      { TRIM: { strategy: 'MAXLEN', threshold: MAX_STREAM_LENGTH } }
    );
  }

  // Publish event with UUID
  async publishEvent(uuid: string, event: any): Promise<string> {
    // Include the UUID in the event data
    const eventWithUuid = {
      ...event,
      uuid
    };

    return await this.redis.xAdd(
      EVENTS_STREAM,
      '*',
      { data: JSON.stringify(eventWithUuid), timestamp: Date.now().toString() },
      { TRIM: { strategy: 'MAXLEN', threshold: MAX_STREAM_LENGTH } }
    );
  }

  // Publish command for a specific Sputnik
  async publishCommand(uuid: string, command: any): Promise<string> {
    // Include the UUID in the command data
    const commandWithUuid = {
      ...command,
      uuid
    };

    return await this.redis.xAdd(
      COMMANDS_STREAM,
      '*',
      { data: JSON.stringify(commandWithUuid), timestamp: Date.now().toString() },
      { TRIM: { strategy: 'MAXLEN', threshold: MAX_STREAM_LENGTH } }
    );
  }

  // Read all positions from stream since lastId
  async readPositions(lastId = '0-0'): Promise<any[]> {
    const entries = await this.redis.xRead(
      [{ key: POSITION_STREAM, id: lastId }],
      { COUNT: 100, BLOCK: 100 }
    );
    
    if (!entries?.length) return [];
    
    return entries[0].messages.map(message => ({
      id: message.id,
      position: JSON.parse(message.message.data)
    }));
  }

  // Read position updates for a specific Sputnik
  async readPositionsForSputnik(uuid: string, lastId = '0-0'): Promise<any[]> {
    const updates = await this.readPositions(lastId);
    return updates.filter(update => update.position.uuid === uuid);
  }

  // Read all events from stream since lastId
  async readEvents(lastId = '0-0'): Promise<any[]> {
    const entries = await this.redis.xRead(
      [{ key: EVENTS_STREAM, id: lastId }],
      { COUNT: 100, BLOCK: 100 }
    );
    
    if (!entries?.length) return [];
    
    return entries[0].messages.map(message => ({
      id: message.id,
      event: JSON.parse(message.message.data)
    }));
  }

  // Read events for a specific Sputnik
  async readEventsForSputnik(uuid: string, lastId = '0-0'): Promise<any[]> {
    const events = await this.readEvents(lastId);
    return events.filter(update => update.event.uuid === uuid);
  }

  // Read all commands from stream since lastId
  async readCommands(lastId = '0-0'): Promise<any[]> {
    const entries = await this.redis.xRead(
      [{ key: COMMANDS_STREAM, id: lastId }],
      { COUNT: 100, BLOCK: 100 }
    );
    
    if (!entries?.length) return [];
    
    return entries[0].messages.map(message => ({
      id: message.id,
      command: JSON.parse(message.message.data)
    }));
  }

  // Read commands for a specific Sputnik
  async readCommandsForSputnik(uuid: string, lastId = '0-0'): Promise<any[]> {
    const commands = await this.readCommands(lastId);
    return commands.filter(update => update.command.uuid === uuid);
  }

  // Register a Sputnik as active
  async registerSputnik(uuid: string): Promise<void> {
    await this.redis.sAdd('sputniks:active', uuid);
  }

  // Get list of all active Sputniks
  async getActiveSputniks(): Promise<string[]> {
    return await this.redis.sMembers('sputniks:active');
  }
} 