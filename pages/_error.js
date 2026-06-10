import React from "react";

function Error({ statusCode }) {
  var rootStyle = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  };

  var innerStyle = { textAlign: "center" };

  return React.createElement("div", { style: rootStyle },
    React.createElement("div", { style: innerStyle },
      React.createElement("h1", { style: { fontSize: "4rem", fontWeight: "bold", margin: "0 0 1rem" } }, statusCode || 500),
      React.createElement("p", { style: { fontSize: "1.25rem", color: "#666" } },
        statusCode === 404 ? "Page Not Found" : "Internal Server Error"
      )
    )
  );
}

Error.getInitialProps = function(ctx) {
  var statusCode = ctx.res ? ctx.res.statusCode : ctx.err ? ctx.err.statusCode : 404;
  return { statusCode: statusCode };
};

export default Error;