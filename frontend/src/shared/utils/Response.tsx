"use client";

import { clearErrorMsg, clearSuccessMsg } from "@shared/store/responseSlice";
import { selectErrorMsg, selectSuccessMsg } from "@shared/store/selectors";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useState } from "react";

const Response = () => {
  const errorMsg = useSelector(selectErrorMsg);
  const successMsg = useSelector(selectSuccessMsg);
  const dispatch = useDispatch();

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // If not mounted, render nothing or placeholder to match SSR HTML (empty)
  if (!hasMounted) {
    return null; // or <div style={{height: 0}} /> to reserve space if needed
  }

  return (
    <aside
      className="fixed top-4 right-4 text-sm text-custom_white font-bold flex flex-col justify-center gap-1 items-end w-full z-50"
      aria-live="polite"
      aria-atomic="true"
    >
      {successMsg && (
        <motion.div
          role="status"
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 30, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="p-[3px] bg-custom_green rounded shadow-md"
        >
          <p className="outline outline-1 pl-2 rounded items-center flex gap-1">
            <span>{successMsg}</span>
            <button
              onClick={() => dispatch(clearSuccessMsg())}
              aria-label="Close success message"
              className="hover:bg-custom_green hover:text-custom_pale_yellow icon_button"
            >
              <CloseIcon fontSize="inherit" />
            </button>
          </p>
        </motion.div>
      )}
      {errorMsg && (
        <motion.div
          role="alert"
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 30, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="p-1 bg-custom_red rounded shadow-md"
        >
          <p className="outline outline-1 pl-2 rounded items-center flex gap-1">
            <span>{errorMsg}</span>
            <button
              onClick={() => dispatch(clearErrorMsg())}
              aria-label="Close error message"
              className="hover:bg-custom_red hover:text-custom_pale_yellow icon_button"
            >
              <CloseIcon fontSize="inherit" />
            </button>
          </p>
        </motion.div>
      )}
    </aside>
  );
};

export default Response;
