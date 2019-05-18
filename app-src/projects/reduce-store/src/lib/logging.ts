import { LogEventType, KeyValuePair, LogConfig } from './classes';
import { StateData } from "./StateData";
import { IClone, IConstructor } from "./interfaces";

export class LogManager {
  isEnabled: boolean = false;
  allStatesConfigPairs: KeyValuePair<LogEventType, LogConfig>[] = [];

  getLogger<T extends IClone<T>>(eventType: LogEventType, stateCtor: IConstructor<T>, stateData: StateData<T>): Logger {
    const emptyLogger = new Logger({ baseLog: () => { } });
    if (!this.isEnabled) return emptyLogger;

    const config = this.getConfig(eventType, stateData);
    if (!config) return emptyLogger;

    const baseLog = this.getBaseLogFunction(eventType, config, stateCtor);
    const stack = this.getCallStack();

    return new Logger({ baseLog, stack });
  }

  private getCallStack(): string[] {
    const logError = new Error();
    const parser = new ErrorParser(logError);
    return parser.getCallStack();
  }

  private getEventTypeName(eventType: LogEventType): string {
    const eventTypeName = LogEventType[eventType];
    if (!eventTypeName) return '';
    return eventTypeName.replace(/([A-Z])/g, ' $1').replace(/^\s+/, '');
  }

  private getConfig(eventType: LogEventType, stateData: StateData<any>): LogConfig {
    let configPair = stateData.logConfigPairs.find(p => (p.key & eventType) > 0);
    if (configPair) return configPair.value;

    configPair = this.allStatesConfigPairs.find(p => (p.key & eventType) > 0);
    return configPair && configPair.value;
  }

  private getBaseLogFunction(eventType: LogEventType, config: LogConfig, stateCtor: IConstructor<any>): ILog {
    const eventTypeName = this.getEventTypeName(eventType);
    const logFn = console[config.level];
    const fn = logFn.bind(logFn, '%c' + config.prefix + eventTypeName, config.css, stateCtor);
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
}

export class Logger {
  private shouldLogDuration: boolean;
  private readonly stopWatch = new StopWatch();

  readonly baseLog: ILog = (...args: any[]) => void {};
  readonly stack: string[];

  //state: any;
  //durationFull?: number;
  //durationRun?: number;
  //args?: any[];

  constructor(init?: Partial<Logger>) {
    Object.assign(this, init);
  }

  startStopWatch(): void {
    this.shouldLogDuration = true;
    this.stopWatch.start();
  }

  stopStopWatch(): void {
    this.stopWatch.stop();
  }

  log(state: any): void {
    const logData = {
      state,
      stask: this.stack
    };

    if (this.shouldLogDuration) {
      logData['duration,ms'] = this.stopWatch.duration;
    }
    this.baseLog(logData);
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
