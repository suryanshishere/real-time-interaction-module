import React from "react";

const DoubleDivider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className="flex items-center gap-2"
    >
      {children && <span>{children}</span>}
      <div className="flex flex-col flex-grow" aria-hidden="true">
        <hr className="mt-2" />
        <hr className="mt-1" />
      </div>
    </div>
  );
};

export default DoubleDivider;
