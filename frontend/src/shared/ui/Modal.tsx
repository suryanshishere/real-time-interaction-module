import React, { ReactNode, useEffect, useRef } from "react";
import CloseIcon from "@mui/icons-material/Close";
import useUserStore from "@shared/hooks/useUserStore";

interface ModalProps {
  open: boolean;
  header: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  onCancel?: (() => void) | boolean;
  confirmButton?: ReactNode;
  childrenClassName?: string;
  tokenExists?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  open,
  header,
  children,
  footer,
  onClose,
  onCancel,
  confirmButton,
  childrenClassName,
  tokenExists,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { is_nav_auth_clicked, is_email_verified } = useUserStore();
  const showAuth = is_nav_auth_clicked || (tokenExists && !is_email_verified);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      }
    } else {
      dialog.close();
    }
  }, [open]);

  const handleCancelOrClose = () => {
    if (typeof onCancel === "function") {
      onCancel();
    } else {
      onClose?.();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-header"
      className="p-0 border-none"
    >
      <div className="fixed p-4 inset-0 flex items-center justify-center bg-custom_black bg-opacity-50 z-50">
        <div className="bg-custom_white rounded shadow-lg p-2 relative flex flex-col min-w-full m-4 sm:min-w-[30rem] sm:max-w-[30rem]">
          {onClose && !showAuth && (
            <button
              onClick={handleCancelOrClose}
              className="icon_button absolute top-2 right-2"
              aria-label="Close modal"
            >
              <CloseIcon />
            </button>
          )}

          {!showAuth && <header
            id="modal-header"
            className="h-8 flex items-center justify-center"
          >
            <h2>{header}</h2>
          </header>}

          <main
            className={`overflow-auto min-h-12 max-h-60 flex flex-col items-center p-2 gap-1 bg-gray-100 rounded-md ${
              childrenClassName || ""
            }`}
          >
            {children}
          </main>

          {footer ? (
            <footer>{footer}</footer>
          ) : confirmButton ? (
            <footer className="flex justify-between gap-2">
              {onCancel && (
                <button
                  onClick={handleCancelOrClose}
                  className="base_button flex-1"
                >
                  Cancel
                </button>
              )}
              {confirmButton}
            </footer>
          ) : null}
        </div>
      </div>
    </dialog>
  );
};

export default Modal;
