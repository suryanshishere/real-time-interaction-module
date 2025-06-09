import { AppDispatch } from "..";
import { triggerErrorMsg, clearErrorMsg, setSuccessMsg, clearSuccessMsg } from "../responseSlice";

export const triggerErrorMsg = (msg: string, timeoutInSeconds: number = 3) => 
  (dispatch: AppDispatch) => {
    dispatch(triggerErrorMsg({ msg }));
    setTimeout(() => {
      dispatch(clearErrorMsg());
    }, timeoutInSeconds * 1000);
  };

export const triggerSuccessMsg = (msg: string, timeoutInSeconds: number = 3) => 
  (dispatch: AppDispatch) => {
    dispatch(setSuccessMsg({ msg }));
    setTimeout(() => {
      dispatch(clearSuccessMsg());
    }, timeoutInSeconds * 1000);
  };
