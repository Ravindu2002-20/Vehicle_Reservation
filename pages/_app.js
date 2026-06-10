import React from "react";

// This file provides React context for Pages Router error pages
export default function App({ Component, pageProps }) {
  return React.createElement(Component, pageProps);
}