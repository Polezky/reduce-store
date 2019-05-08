
var defaultPrefix = 'ReduceStore:';
var defaultCss = 'color: green;';

export type LogLevel = 'log' | 'info' | 'debug' | 'warn' | 'trace';
export enum EventType {
  StateGetter = 1 << 0,
  SubscriberNotification = 1 << 1,
  SubscriberAdded = 1 << 2,
  SubscriberRemoved = 1 << 3,
  Reducer = 1 << 4,
}

export class LogConfig { // todo: add different config for different event types
  prefix?: string = defaultPrefix;
  level?: LogLevel = 'log';
  css?: string = defaultCss;
  eventType?: EventType;
  shouldLogData?: boolean = false;
  shouldLogTime?: boolean = false;

  constructor(init?: Partial<LogConfig>) {
    Object.assign(this, init || {});
  }
}

export class Logger {
  private readonly config: LogConfig;

  constructor(config?: Partial<LogConfig>) {
    this.config = new LogConfig(config);
  }

  async log<T>(eventType: EventType, eventItem, data, action: () => Promise<T>): Promise<T> {
    if ((this.config.eventType & eventType) == 0) {
      return action();
    }

    const logFn = this.getLogFunction();
    const eventTypeName = EventType[eventType];

    if (this.config.shouldLogData) {
      logFn(eventTypeName, eventItem, data);
    } else {
      logFn(eventTypeName, eventItem);
    }

    let start: number;
    if (this.config.shouldLogTime) {
      start = performance.now();
    }

    let error;
    let result: T;
    const promise = action()
      .then(r => result = r)
      .catch(e => error = e);

    await promise;

    if (this.config.shouldLogTime) {
      const end = performance.now();
      logFn(eventTypeName, eventItem, 'time, ms:', end - start);
    }

    if (error) {
      return Promise.reject(error);
    } else {
      return Promise.resolve(result);
    }
  }

  private getLogFunction(): (...args: any[]) => void {
    const fn = console[this.config.level].bind(window.console, '%c' + this.config.prefix, this.config.css);
    return fn;
  }
}
