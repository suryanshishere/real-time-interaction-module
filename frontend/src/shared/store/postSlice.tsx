import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PostState {
  isEditPostClicked: boolean;
  isEditContribute: {
    clicked: boolean;
    section: string;
    postCode: string;
  };
  isAllKeyValuePairsStored: boolean;
  keyValuePairs: Record<string, any>;
}

const initialState: PostState = {
  isEditPostClicked: false,
  isEditContribute: {
    clicked: false,
    section: "",
    postCode: "",
  },
  isAllKeyValuePairsStored: false,
  keyValuePairs: {},
};

const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    setEditContribute(
      state,
      action: PayloadAction<{
        clicked: boolean;
        section: string;
        postCode: string;
      }>
    ) {
      state.isEditContribute = action.payload;
    },
    setEditPostClicked(state, action: PayloadAction<boolean>) {
      state.isEditPostClicked = action.payload;
    },
    setKeyValuePair(state, action: PayloadAction<{ key: string; value: any }>) {
      const { key, value } = action.payload;
      state.keyValuePairs[key] = value;

      //TODO
      // Update `isAllKeyValuePairsStored` based on a condition, e.g.,
      // when the number of key-value pairs reaches a certain number.
      // Replace the condition with your own logic if needed.
      state.isAllKeyValuePairsStored =
        Object.keys(state.keyValuePairs).length > 0;
    },
    resetKeyValuePairs(state) {
      state.keyValuePairs = {};
      state.isAllKeyValuePairsStored = false;
      state.isEditPostClicked = false;
    },
    removeKeyValuePair(state, action: PayloadAction<string>) {
      const keyToRemove = action.payload;
      if (state.keyValuePairs[keyToRemove] !== undefined) {
        delete state.keyValuePairs[keyToRemove];
      }

      // Update `isAllKeyValuePairsStored` after removal
      state.isAllKeyValuePairsStored =
        Object.keys(state.keyValuePairs).length > 0;
    },
  },
});

export const {
  setEditPostClicked,
  setEditContribute,
  setKeyValuePair,
  resetKeyValuePairs,
  removeKeyValuePair,
} = postSlice.actions;
export default postSlice.reducer;
