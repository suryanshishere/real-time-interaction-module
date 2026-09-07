import { configureStore } from "@reduxjs/toolkit";
import responseReducer from "./responseSlice";

const store = configureStore({ reducer: { response: responseReducer } });

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export default store;
