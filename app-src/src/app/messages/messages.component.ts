import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from 'reduce-store';
import * as messages from '@app/messages/messages.state';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit, OnDestroy {
  messagesState: messages.State;

  constructor() {
    Store.state.subscribe(messages.State, this, s => this.messagesState = s);
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
  }

  clearMessages(): void {
    Store.reduce.byDelegate(messages.State, messages.clearMessagesReducer);
  }

}
