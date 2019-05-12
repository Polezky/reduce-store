import { LogEventType, KeyValuePair, LogConfig } from './classes';
import { IConstructor } from './interfaces';
import { StateData } from './private-classes';

export class Logger {
  isEnabled: boolean = false;
  allStatesConfigPairs: KeyValuePair<LogEventType, LogConfig>[] = [];

  log(eventType: LogEventType, stateCtor: IConstructor<any>, caller: Function, stateData: StateData<any>, duration?: number, args?: any[]): void {
    if (!this.isEnabled) {
      return;
    }

    const config = this.getConfig(eventType, stateData);
    if (!config) {
      return;
    }

    const logFn = this.getLogFunction(config);
    const eventTypeName = LogEventType[eventType];

    if (config.groupType == 'group') {
      console.group(eventTypeName);
    } else if (config.groupType == 'groupCollapsed') {
      console.groupCollapsed(eventTypeName);
    }

    const logData = {
      eventTypeName,
      stateCtor,
      caller,
      state: stateData.state
    };

    if (duration !== undefined)
      logData['duration'] = duration;

    if (args)
      logData['args'] = args;

    logFn(logData);

    if (config.groupType)
      console.groupEnd();
  }

  private getConfig(eventType: LogEventType, stateData: StateData<any>): LogConfig {
    let configPair = stateData.logConfigPairs.find(p => (p.key & eventType) > 0);
    if (configPair) return configPair.value;

    configPair = this.allStatesConfigPairs.find(p => (p.key & eventType) > 0);
    return configPair && configPair.value;
  }

  private getLogFunction(config: LogConfig): (...args: any[]) => void {
    const fn = console[config.level].bind(window.console, '%c' + config.prefix, config.css);
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
