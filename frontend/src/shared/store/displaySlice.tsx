import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: Record<string, boolean> = {};
const displaySlice = createSlice({
  name: "display",
  initialState,
  reducers: {
    toggleDisplayState(
      state,
      action: PayloadAction<
        { id: string; bool?: boolean } | Array<{ id: string; bool?: boolean }>
      >
    ) {
      const payload = action.payload;
      if (Array.isArray(payload)) {
        payload.forEach(({ id, bool }) => {
          state[id] = bool !== undefined ? bool : !state[id];
        });
      } else {
        const { id, bool } = payload;
        state[id] = bool !== undefined ? bool : !state[id];
      }
    },
    closeAllDisplay() {
      return initialState;
    },
  },
});

export const { toggleDisplayState, closeAllDisplay } = displaySlice.actions;
export default displaySlice.reducer;
