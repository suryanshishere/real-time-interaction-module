import React, { ReactNode } from "react";
import DoubleDivider from "./DoubleDivider";

const PageHeader: React.FC<{
  header: ReactNode;
  subHeader?: ReactNode;
}> = ({ subHeader, header }) => {
  let formattedDate;

  return (
    <header className="w-full flex flex-col" aria-label="Page header">
      <h1>{header}</h1>
      <DoubleDivider>
        {subHeader && <h3 className="text-custom_gray">{subHeader}</h3>}
      </DoubleDivider>
    </header>
  );
};

export default PageHeader;
