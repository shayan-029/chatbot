"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function ApiDocs() {
  return (
    <div className="h-screen overflow-y-auto bg-white">
      <SwaggerUI url="/api/docs" />
    </div>
  );
}
