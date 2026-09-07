import type { RootState } from "..";

export const selectErrorMsg = (state: RootState) => state.response.onErrorMsg;
export const selectSuccessMsg = (state: RootState) => state.response.onSuccessMsg;
export const selectIsLoading = (state: RootState) => state.response.isLoading;
