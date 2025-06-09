import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: Record<string, boolean> = {};
const dropdownSlice = createSlice({
  name: "dropdown",
  initialState,
  reducers: {
    toggleDropdownState(
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
    closeAllDropdowns() {
      return initialState;
    },
  },
});

export const { toggleDropdownState, closeAllDropdowns } = dropdownSlice.actions;
export default dropdownSlice.reducer;
