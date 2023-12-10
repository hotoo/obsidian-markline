import * as React from "react";
import { createRoot } from "react-dom/client";
import { Markline } from './markline';

export class Processor {

  static render(source: string, el: HTMLElement) {
    const root = createRoot(el);
    root.render(
      <React.StrictMode>
        <Markline markdown={source} />
      </React.StrictMode>
    );
  }
}