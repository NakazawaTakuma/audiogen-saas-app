// src/components/Modal.tsx
import React, { ReactNode, useEffect, useRef } from "react";
import styles from "./modal.module.css";

type ModalProps = {
  title?: string;
  children: ReactNode;
  onClose: () => void;
};

const Modal: React.FC<ModalProps> = ({ title, children, onClose }) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        overlayRef.current &&
        e.target instanceof Node &&
        !overlayRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className={styles.modal}>
      <div className={styles.window} ref={overlayRef}>
        {title && (
          <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            <button
              className={styles.close_button}
              onClick={onClose}
              aria-label="閉じる"
            >
              &times;
            </button>
          </div>
        )}

        <div className={styles.modal_content}>{children}</div>

        <div className={styles.modal_footer}>
          <button className={styles.footer_close_button} onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
