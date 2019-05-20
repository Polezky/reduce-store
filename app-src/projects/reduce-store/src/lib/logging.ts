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

  log<T extends IClone<T>>(
    stateCtor: IConstructor<T>,
    eventType: LogEventType,
    stateData: StateData<T>,
    logData: ILogData<T>): void {

    new Logger(stateCtor).log(eventType, stateData, logData);
  }
}

export const LogManager: Manager = Manager.instance;

export interface ILog {
  (...args: any[]): void;
}

export interface ILogData<T extends IClone<T>> {
  state: T;
  stateCtor?: IConstructor<T>;
  args?: any[];
  stack?: string[];
  'duration,ms'?: number;
  'durationFull,ms'?: number;
  'durationRun,ms'?: number;
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

export class Logger<T extends IClone<T>> {
  private readonly baseFnList = this.getBaseLogFunctions();
  private readonly logError: Error = LogManager.isEnabled ? new Error() : undefined;

  constructor(
    protected readonly stateCtor: IConstructor<T>
  ) {}

  log(eventType: LogEventType, stateData: StateData<T>, logData: ILogData<T>): void {
    if (!LogManager.isEnabled) return;

    const config = this.getConfig(eventType, stateData);
    if (!config) return;

    const data = this.getLogData(logData);
    this.writeLogData(eventType, config, data);
  };

  protected getLogData(data: ILogData<T>): ILogData<T> {
    const logData = Object.assign({}, data) as ILogData<T>;

    logData.stateCtor = this.stateCtor;

    if (data.args)
      logData.args = data.args.filter(x => x !== undefined);

    if (this.logError) {
      logData.stack = this.getCallStack();
    }
    return logData;
  };

  private getConfig(eventType: LogEventType, stateData: StateData<T>): LogConfig {
    let configPair = stateData.logConfigPairs.find(p => (p.key & eventType) > 0);
    if (configPair) return configPair.value;

    configPair = LogManager.allStatesConfigPairs.find(p => (p.key & eventType) > 0);
    return configPair && configPair.value;
  }

  private writeLogData(eventType: LogEventType, config: LogConfig, data: ILogData<T>): void {
    const baseLog = this.baseFnList.find(x => x.key == config.level).value;
    const eventTypeName = this.getEventTypeName(eventType);
    baseLog('%c' + config.prefix + eventTypeName, config.css, data);
  }

  private getEventTypeName(eventType: LogEventType): string {
    const eventTypeName = LogEventType[eventType];
    if (!eventTypeName) return '';
    return eventTypeName.replace(/([A-Z])/g, ' $1').replace(/^\s+/, '');
  }

  private getCallStack(): string[] {
    const parser = new ErrorParser(this.logError);
    return parser.getCallStack();
  }

  private getBaseLogFunctions(): KeyValuePair<LogLevel, ILog>[] {
    const levels = Object.keys(LogLevel)
      .filter(x => isNaN(+x))
      .map(x => x);
    const fnList = Object.keys(console)
      .map(f => {
        const level = levels.find(l => l.toLowerCase() == f);
        if (!level) return undefined;
        return {
          key: LogLevel[level],
          value: console[f].bind(console) as ILog
        };
      })
      .filter(pair => pair);

    return fnList;
  }
}

export class DurationLogger<T extends IClone<T>> extends Logger<T> {
  private watches = new StopWatch();

  constructor(stateCtor: IConstructor<T>) {
    super(stateCtor);
    this.watches.start();
  }

  protected getLogData(state: any): ILogData<T> {
    const logData = super.getLogData(state);
    logData['duration,ms'] = this.watches.duration;
    return logData;
  };
}

export class ReducerLogger<T extends IClone<T>> extends Logger<T> {
  private watches = new StopWatch();
  private runWatches = new StopWatch();

  constructor(stateCtor: IConstructor<T>) {
    super(stateCtor);
    this.watches.start();
  }

  startRunWatches(): void {
    this.runWatches.start();
  }

  stopRunWatches(): void {
    this.runWatches.stop();
  }

  protected getLogData(state: any): ILogData<T> {
    const logData = super.getLogData(state);
    logData['durationFull,ms'] = this.watches.duration;
    logData['durationRun,ms'] = this.runWatches.duration;
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
