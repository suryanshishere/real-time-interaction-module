import { createSelector } from "reselect";
import { RootState } from "..";

export const selectResponse = (state: RootState) => state.response;

export const selectErrorMsg = createSelector(
  [selectResponse],
  (response) => response.onErrorMsg
);

export const selectSuccessMsg = createSelector(
  [selectResponse],
  (response) => response.onSuccessMsg
);

export const selectIsLoading = createSelector(
  [selectResponse],
  (response) => response.isLoading
);
