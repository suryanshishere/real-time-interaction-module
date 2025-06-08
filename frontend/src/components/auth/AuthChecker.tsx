"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/shared/store";
import Modal from "@/shared/ui/Modal";
import { closeAllModal, toggleModalState } from "@/shared/store/modalSlice";
import useUserStore from "@/shared/hooks/useUserStore";

const AuthChecker: React.FC<{ tokenExpiration: string | null }> = ({
  tokenExpiration,
}) => {
  const isModalOpen = useSelector(
    (state: RootState) => state.modal.modalStates["auth_session"]
  );
  const dispatch = useDispatch();
  const { logout, handleAuthClick } = useUserStore();

  useEffect(() => {
    if (isModalOpen) {
      console.log("Modal should be open now");
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (!tokenExpiration) return;

    const expirationTime = new Date(tokenExpiration).getTime();
    const currentTime = Date.now();

    if (currentTime >= expirationTime) {
      dispatch(toggleModalState({ id: "auth_session", bool: true }));
    }
  }, [tokenExpiration, dispatch]);

  const closeModalHandler = () => {
    dispatch(closeAllModal());
    logout();
    handleAuthClick(true);
  };

  return (
    <section
      role="complementary"
      aria-label="Session Expiration Notification"
      className="flex flex-col"
    >
      <Modal
        open={isModalOpen}
        header="Session Expired"
        footer={
          <button onClick={closeModalHandler} className="base_button">
            Close
          </button>
        }
      >
        <p className="text-center">
          Your session has expired. <br /> Please log in again to continue.
        </p>
      </Modal>
    </section>
  );
};

export default AuthChecker;
