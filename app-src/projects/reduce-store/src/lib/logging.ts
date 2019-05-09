import { LogEventType, KeyValuePair, LogConfig } from './classes';
import { StateData } from './private-classes';

export class Logger {
  isEnabled: boolean;
  allStatesConfigPairs: KeyValuePair<LogEventType, LogConfig>[] = [];

  async log<T>(eventType: LogEventType, eventItem, stateData: StateData<any>, args, action: () => Promise<T>): Promise<T> {
    if (!this.isEnabled) {
      return action();
    }

    const config = this.getConfig(eventType, stateData);
    if (!config) {
      return action();
    }

    const logFn = this.getLogFunction(config);
    const eventTypeName = LogEventType[eventType];

    if (config.groupType == 'group') {
      console.group();
    } else if (config.groupType == 'groupCollapsed') {
      console.groupCollapsed();
    }

    if (config.shouldLogData) {
      logFn(eventTypeName, eventItem, { state: stateData.state, args });
    } else {
      logFn(eventTypeName, eventItem);
    }

    let start: number;
    if (config.shouldLogTime) {
      start = performance.now();
    }

    let error;
    let result: T;
    const promise = action()
      .then(r => result = r)
      .catch(e => error = e);

    await promise;

    if (config.shouldLogTime) {
      const end = performance.now();
      logFn(eventTypeName, eventItem, 'time, ms:', end - start);
    }

    if (config.groupType)
      console.groupEnd();

    if (error) {
      return Promise.reject(error);
    } else {
      return Promise.resolve(result);
    }
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
  const eventTypes = new Array<LogEventType>();
  while (type <= LogEventType.Reducer) {
    type = 1 << index;
    index++;
    if ((eventType & type) > 0) continue;
    eventTypes.push(type);
  }

  return eventTypes.map(x => { return { key: x, value: configuration } });
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
