import { LogEventType, KeyValuePair, LogConfig, LogLevel } from './classes';
import { StateData } from "./StateData";
import { IClone, IConstructor } from "./interfaces";

export class LogManager {
  isEnabled: boolean = false;
  allStatesConfigPairs: KeyValuePair<LogEventType, LogConfig>[] = [];

  getLogger<T extends IClone<T>>(stateCtor: IConstructor<T>, stateData: StateData<T>, eventType?: LogEventType): Logger {
    const emptyLogger = new Logger();
    if (!this.isEnabled) return emptyLogger;

    const config = this.getConfig(eventType, stateData);
    if (!config) return emptyLogger;

    const baseLog = this.getBaseLogFunction(config.level);
    const stack = this.getCallStack();

    return new Logger({ isEnabled: true, baseLog, stack, config, stateCtor, eventType });
  }

  getLoggerWithDuration<T extends IClone<T>>(stateCtor: IConstructor<T>, stateData: StateData<T>, eventType?: LogEventType): LoggerWithDuration {
    const logger = this.getLogger(stateCtor, stateData, eventType);
    return new LoggerWithDuration(logger);
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

export interface ILog {
  (...args: any[]): void;
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
  readonly isEnabled: boolean = false;
  readonly baseLog: ILog = (...args: any[]) => void {};
  readonly stack: string[];
  readonly config: LogConfig;
  readonly stateCtor: IConstructor<any>;
  readonly eventType: LogEventType;

  //state: any;
  //durationFull?: number;
  //durationRun?: number;
  //args?: any[];

  constructor(init?: Partial<Logger>) {
    Object.assign(this, init);
  }

  log(state: any): void {
    if (!this.isEnabled) return;
    const logData = this.getLogData(state);
    this.writeLogData(logData);
  };

  //logWithArgs(state: any, args: any[]): void {
  //  if (!this.isEnabled) return;
  //  const logData = this.getLogData(state);
  //  if (args)
  //    logData['args'] = args.filter(x => x !== undefined);

  //  this.writeLogData(logData);
  //};

  clone(newEventType: LogEventType): Logger {
    let copy = Object.assign({}, this, { eventType: newEventType }) as Logger;
    copy = new Logger(copy);
    //copy.watches = this.watches.clone();
    return copy;
  }

  protected getLogData(state: any): any {
    const logData = { state };

    if (this.stack && this.stack.length) {
      logData['stack'] = this.stack;
    }
  };

  private writeLogData(data: any): void {
    const eventTypeName = this.getEventTypeName(this.eventType);
    this.baseLog('%c' + this.config.prefix + eventTypeName, this.config.css, this.stateCtor, data);
  }

  private getEventTypeName(eventType: LogEventType): string {
    const eventTypeName = LogEventType[eventType];
    if (!eventTypeName) return '';
    return eventTypeName.replace(/([A-Z])/g, ' $1').replace(/^\s+/, '');
  }
}

export class LoggerWithDuration extends Logger {
  private watches = new StopWatch();

  constructor(init?: Partial<Logger>) {
    super(init);
    this.watches.start();
  }

  protected getLogData(state: any): any {
    const logData = super.getLogData(state);
    logData['duration,ms'] = this.watches.duration;
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

/*
 static createReducerResolved<T extends IClone<T>>(
    stateCtor: IConstructor<T>,
    deferredReducer: DeferredReducer<T>,
    stateData: StateData<T>): Logger {

    return new Logger({
      eventType: LogEventType.ReducerResolved,
      stateCtor,
      logError: deferredReducer.logError,
      stateData,
      state: stateData.state,
      durationFull: deferredReducer.fullDuration,
      durationRun: deferredReducer.runDuration,
      args: deferredReducer.reducerArgs
    });
  }

  static createStateGetterResolved<T extends IClone<T>>(
    stateCtor: IConstructor<T>,
    deferredGetter: DeferredGetter<T>,
    stateData: StateData<T>): Logger {

    return new Logger({
      eventType: LogEventType.StateGetterResolved,
      stateCtor,
      logError: deferredGetter.logError,
      stateData,
      state: stateData.state,
      durationFull: deferredGetter.fullDuration,
    });
  }

  static createReducer<T extends IClone<T>>(
    eventType: LogEventType,
    stateCtor: IConstructor<T>,
    stateData: StateData<T>,
    logError: Error,
    args: any[]
  ): Logger {

    return new Logger({
      eventType,
      stateCtor,
      logError,
      stateData,
      state: stateData.state,
      args
    });
  }

  static createStateSuspended<T extends IClone<T>>(
    stateCtor: IConstructor<T>,
    stateData: StateData<T>,
    logError: Error,
    durationContainer: StopWatch
  ): Logger {

    return new Logger({
      eventType: LogEventType.StateSuspended,
      stateCtor,
      logError,
      stateData,
      state: stateData.state,
      durationFull: durationContainer.fullDuration
    });
  }

  static create<T extends IClone<T>>(
    eventType: LogEventType,
    stateCtor: IConstructor<T>,
    stateData: StateData<T>,
    logError: Error,
  ): Logger {

    return new Logger({
      eventType,
      stateCtor,
      stateData,
      state: stateData.state,
      logError,
    });
  }
 */
