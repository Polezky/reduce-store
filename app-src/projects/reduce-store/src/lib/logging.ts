import { LogEventType, KeyValuePair, LogConfig, LogLevel } from './classes';
import { StateData } from "./StateData";
import { IClone, IConstructor } from "./interfaces";

class Manager {
  private static _instance: Manager;

  static get instance(): Manager {
    return Manager._instance || (Manager._instance = new Manager());
  }

  private constructor() { }

  isEnabled: boolean = false;
  allStatesConfigPairs: KeyValuePair<LogEventType, LogConfig>[] = [];

  getLogger<T extends IClone<T>>(stateCtor: IConstructor<T>, stateData: StateData<T>, eventType?: LogEventType): Logger {
    const emptyLogger = new Logger();
    if (!this.isEnabled) return emptyLogger;

    const config = this.getConfig(eventType, stateData);
    if (!config) return emptyLogger;

    const baseLog = this.getBaseLogFunction(config.level);
    const stack = this.getCallStack();

    return new Logger({ baseLog, stack, config, stateCtor, eventType });
  }

  getDurationLogger<T extends IClone<T>>(stateCtor: IConstructor<T>, stateData: StateData<T>, eventType?: LogEventType): DurationLogger {
    const logger = this.getLogger(stateCtor, stateData, eventType);
    return new DurationLogger(logger);
  }

  getReducerLogger<T extends IClone<T>>(stateCtor: IConstructor<T>, stateData: StateData<T>, eventType?: LogEventType): ReducerLogger {
    const logger = this.getLogger(stateCtor, stateData, eventType);
    return new ReducerLogger(logger);
  }

  private getCallStack(): string[] {
    const logError = new Error();
    const parser = new ErrorParser(logError);
    return parser.getCallStack();
  }

  private getConfig(eventType: LogEventType, stateData: StateData<any>): LogConfig {
    let configPair = stateData.logConfigPairs.find(p => (p.key & eventType) > 0);
    if (configPair) return configPair.value;

    configPair = this.allStatesConfigPairs.find(p => (p.key & eventType) > 0);
    return configPair && configPair.value;
  }

  private getBaseLogFunction(logLevel: LogLevel): ILog {
    const logFn = console[logLevel];
    const fn = logFn.bind(logFn);
    return fn;
  }
}

export const LogManager: Manager = Manager.instance;

export interface ILog {
  (...args: any[]): void;
}

export interface ILogData {
  state: any;
  args?: any[];
  stack?: string[];
  'duration,ms'?: string;
  'durationFull,ms'?: string;
  'durationRun,ms'?: string;
}

export class StopWatch {
  private startTime: number;
  private endTime: number;
  private _isStarted: boolean = false;
  private _isStopped: boolean = false;

  get isStarted(): boolean { return this._isStarted; };
  get isStopped(): boolean { return this._isStopped; };

  get duration(): number {
    return (this.endTime || performance.now()) - this.startTime;
  }

  start(): void {
    this._isStarted = true;
    this._isStopped = false;
    this.endTime = 0;
    this.startTime = performance.now();
  }

  stop(): void {
    this._isStarted = false;
    this._isStopped = true;
    this.endTime = performance.now();
  }

  clone(): StopWatch {
    const copy = new StopWatch();
    copy.startTime = this.startTime;
    copy.endTime = this.endTime;
    copy._isStarted = this._isStarted;
    copy._isStopped = this._isStopped;
    return copy;
  }
}

export class Logger {
  readonly baseLog: ILog = (...args: any[]) => void {};
  readonly stack: string[];
  readonly config: LogConfig;
  readonly stateCtor: IConstructor<any>;
  readonly eventType: LogEventType;

  constructor(init?: Partial<Logger>) {
    Object.assign(this, init);
  }

  log(data: ILogData): void {
    if (!LogManager.isEnabled) return;
    const logData = this.getLogData(data);
    this.writeLogData(logData);
  };

  clone(newEventType: LogEventType): Logger {
    let copy = Object.assign({}, this, { eventType: newEventType }) as Logger;
    copy = new Logger(copy);
    return copy;
  }

  protected getLogData(data: ILogData): ILogData {
    const logData = Object.assign({}, data);

    if (data.args)
      logData.args = data.args.filter(x => x !== undefined);

    if (this.stack && this.stack.length) {
      logData.stack = this.stack;
    }
    return logData;
  };

  private writeLogData(data: ILogData): void {
    const eventTypeName = this.getEventTypeName(this.eventType);
    this.baseLog('%c' + this.config.prefix + eventTypeName, this.config.css, this.stateCtor, data);
  }

  private getEventTypeName(eventType: LogEventType): string {
    const eventTypeName = LogEventType[eventType];
    if (!eventTypeName) return '';
    return eventTypeName.replace(/([A-Z])/g, ' $1').replace(/^\s+/, '');
  }
}

export class DurationLogger extends Logger {
  private watches = new StopWatch();

  constructor(init?: Partial<Logger>) {
    super(init);
    this.watches.start();
  }

  protected getLogData(state: any): ILogData {
    const logData = super.getLogData(state);
    logData['duration,ms'] = this.watches.duration.toString();
    return logData;
  };

  clone(newEventType: LogEventType): Logger {
    let copy = new DurationLogger(super.clone(newEventType));
    copy.watches = this.watches.clone();
    return copy;
  }
}

export class ReducerLogger extends Logger {
  private watches = new StopWatch();
  private runWatches = new StopWatch();

  constructor(init?: Partial<Logger>) {
    super(init);
    this.watches.start();
  }

  startRunWatches(): void {
    this.runWatches.start();
  }

  stopRunWatches(): void {
    this.runWatches.stop();
  }

  protected getLogData(state: any): ILogData {
    const logData = super.getLogData(state);
    logData['durationFull,ms'] = this.watches.duration.toString();
    logData['durationRun,ms'] = this.watches.duration.toString();
    return logData;
  };
}

export function getLogConfigPairs(eventType: LogEventType, config: Partial<LogConfig>): KeyValuePair<LogEventType, LogConfig>[] {
  const configuration = new LogConfig(config);

  let index = 0;
  let type: LogEventType = 0;
  const types = new Array<LogEventType>();
  const allTypes = Object.keys(LogEventType).filter(x => +x).map(x => +x);
  const maxType = Math.max(...allTypes);
  while (type <= maxType) {
    type = 1 << index;
    index++;
    if ((eventType & type) > 0) {
      types.push(type);
    }
  }

  return types.map(x => { return { key: x, value: configuration } });
}

export function getUpdatedLogConfigPairs(
  existingPairs: KeyValuePair<LogEventType, LogConfig>[],
  newPairs: KeyValuePair<LogEventType, LogConfig>[]): KeyValuePair<LogEventType, LogConfig>[] {

  const updatedPairs = existingPairs.slice();
  newPairs.forEach(newPair => {
    const existingPair = updatedPairs.find(x => x.key == newPair.key);
    if (existingPair) {
      existingPair.value = newPair.value;
    } else {
      updatedPairs.push(newPair);
    }
  });

  return updatedPairs;
}


class ErrorParser {
  private readonly error: any;

  constructor(error: Error) {
    this.error = error as any;
  }

  getCallStack(): string[] {
    let lines = [];
    if (!this.error) return lines;

    let stack: string = this.error.stack || this.error.stacktrace;

    if (!stack) {
      try {
        throw this.error;
      } catch (e) {
        stack = e.stack || '';
      }
    }

    stack = stack.trim();

    const skipLinesCount = stack.indexOf('Error') == 0 ? 4 : 3;
    lines = stack.split('\n')
      .slice(skipLinesCount)
      .map(x => x.trim());
    return lines;
  }

}
