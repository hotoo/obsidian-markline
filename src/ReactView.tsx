import * as React from "react";

export const ReactView = () => {
  const html = '<span style="color:red">RED</span>';
  return (<>
    <h4>Hello, React!</h4>
    <div>{html}</div>
  </>);
};