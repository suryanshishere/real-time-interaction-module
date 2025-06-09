import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "./storage";
import dropdownReducer from "./dropdownSlice";
import responseReducer from "./responseSlice";
import postReducer from "./postSlice";
import modalReducer from "./modalSlice";
import displayReducer from "./displaySlice";

const displayPersistConfig = {
  key: "display",
  storage,
};

const store = configureStore({
  reducer: {
    dropdown: dropdownReducer,
    response: responseReducer,

    display: persistReducer<ReturnType<typeof displayReducer>>(
      displayPersistConfig,
      displayReducer
    ),
    post: postReducer,
    modal: modalReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export default store;
