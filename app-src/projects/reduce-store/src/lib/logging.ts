import { LogEventType, KeyValuePair, LogConfig } from './classes';
import { IConstructor } from './interfaces';
import { StateData } from './private-classes';

export class Logger {
  isEnabled: boolean = false;
  allStatesConfigPairs: KeyValuePair<LogEventType, LogConfig>[] = [];

  log(eventType: LogEventType, stateCtor: IConstructor<any>, logError: Error, stateData: StateData<any>, duration?: number, args?: any[]): void {
    if (!this.isEnabled) {
      return;
    }

    const config = this.getConfig(eventType, stateData);
    if (!config) {
      return;
    }

    const eventTypeName = this.getEventTypeName(eventType);
    const logFn = this.getLogFunction(eventTypeName, config);

    if (config.groupType == 'group') {
      console.group(eventTypeName);
    } else if (config.groupType == 'groupCollapsed') {
      console.groupCollapsed(eventTypeName);
    }

    const logData = {
      stateCtor,
      state: stateData.state
    };

    if (config.level != 'trace')
      logData['stack'] = this.getCallStack(logError);

    if (duration !== undefined)
      logData['duration,ms'] = duration;

    if (args)
      logData['args'] = args.filter(x => x);

    logFn(logData);

    if (config.groupType)
      console.groupEnd();
  }

  private getCallStack(logError: Error): string[] {
    // https://github.com/gabrielnahmias/Console.js
    // http://www.stacktracejs.com/#!/docs/stacktrace-js
    // https://stackoverflow.com/questions/591857/how-can-i-get-a-javascript-stack-trace-when-i-throw-an-exception
    let lines = logError.stack.split('\n').slice(4);
    return lines;
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

  private getLogFunction(eventTypeName: string, config: LogConfig): (...args: any[]) => void {
    const fn = console[config.level].bind(window.console, '%c' + config.prefix + eventTypeName, config.css);
    return fn;
  }
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
