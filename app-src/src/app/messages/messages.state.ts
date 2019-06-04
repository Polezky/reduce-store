import { Clone } from 'reduce-store';

export class State extends Clone<State>{
  messages: string[];
}

export function initReducer(currentState: State = new State()): Promise<State> {
  currentState.messages = currentState.messages || [];
  return Promise.resolve(currentState);
}

export function addMessageReducer(currentState: State, message: string): Promise<State> {
  currentState.messages = currentState.messages || [];
  currentState.messages.push(message);
  return Promise.resolve(currentState);
}

export function clearMessagesReducer(currentState: State): Promise<State> {
  currentState.messages = [];
  return Promise.resolve(currentState);
}
