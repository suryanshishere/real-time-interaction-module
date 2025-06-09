import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ModalState {
  modalStates: Record<string, boolean>;
}

const initialState: ModalState = {
  modalStates: {},
};

const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    toggleModalState(
      state,
      action: PayloadAction<{ id: string; bool?: boolean }>
    ) {
      const { id, bool } = action.payload;
      state.modalStates[id] = bool ?? !state.modalStates[id];
    },
    closeSpecificModal(state, action: PayloadAction<string[]>) {
      action.payload.forEach((id) => {
        if (state.modalStates[id]) {
          state.modalStates[id] = false;
        }
      });
    },
    closeAllModal(state) {
      state.modalStates = {};
    },
  },
});

export const { toggleModalState, closeSpecificModal, closeAllModal } =
  modalSlice.actions;
export default modalSlice.reducer;
