import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ResponseState {
  onErrorMsg: string | null;
  onSuccessMsg: string | null;
  isLoading: boolean;
}

const initialState: ResponseState = {
  onErrorMsg: null,
  onSuccessMsg: null,
  isLoading: false,
};

const responseSlice = createSlice({
  name: "response",
  initialState,
  reducers: {
    setErrorMsg(state, action: PayloadAction<{ msg: string; timeout?: number }>) {
      state.onErrorMsg = action.payload.msg;
    },
    clearErrorMsg(state) {
      state.onErrorMsg = null;
    },
    setSuccessMsg(state, action: PayloadAction<{ msg: string; timeout?: number }>) {
      state.onSuccessMsg = action.payload.msg;
    },
    clearSuccessMsg(state) {
      state.onSuccessMsg = null;
    },
    setIsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setErrorMsg,
  clearErrorMsg,
  setSuccessMsg,
  clearSuccessMsg,
  setIsLoading,
} = responseSlice.actions;

export default responseSlice.reducer;