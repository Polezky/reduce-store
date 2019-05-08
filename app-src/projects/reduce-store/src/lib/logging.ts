var defaultPrefix = 'ReduceStore:';
var defaultCss = 'color: green;';

export type LogLevel = 'log' | 'info' | 'debug' | 'warn' | 'trace';
export enum EventType {
  Reducer = 0,
  StateGetter = 1 << 0,
  SubscriberNotification = 1 << 1,
  SubscriberAdded = 1 << 2,
  SubscriberRemoved = 1 << 3
}

export class LogConfig {
  prefix: string = defaultPrefix;
  level: LogLevel;
  css: string = defaultCss;
  eventType: EventType;
  shouldLogData: boolean;
  shouldLogTime: boolean;
}

export class Logger {

  config: LogConfig;

  log(eventType: EventType, data, action: () => void): void {
    
  }

  private getLogFunction(): (data) => void {
    const fn = console[this.config.level].bind(window.console, '%c' + this.config.prefix, this.config.css);
    return fn;
  }

}
