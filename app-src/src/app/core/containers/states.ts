import { Clone, AsyncReducer } from "reduce-store";

export class LayoutState extends Clone<LayoutState> {
  showSidenav: boolean;
}

export class ToggleSidebarReducer extends AsyncReducer<LayoutState>{
  stateCtor = LayoutState;

  reduce(state: LayoutState): LayoutState {
    state.showSidenav = !state.showSidenav;
    return state;
  }
}
