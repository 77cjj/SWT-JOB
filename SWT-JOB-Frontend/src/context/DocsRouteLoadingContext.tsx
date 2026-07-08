/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext } from "react";

const DocsRouteLoadingContext = createContext(false);

export function DocsRouteLoadingProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: boolean;
}) {
  return (
    <DocsRouteLoadingContext.Provider value={value}>
      {children}
    </DocsRouteLoadingContext.Provider>
  );
}

export function useDocsRouteLoading() {
  return useContext(DocsRouteLoadingContext);
}
