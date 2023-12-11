import * as React from "react";
import { createRoot } from "react-dom/client";
import { Markline } from './markline';
import { MarklinePluginSettings } from './types';

export class Processor {
  settings: MarklinePluginSettings;

  constructor(settings: MarklinePluginSettings) {
    this.settings = settings;
  }

  render = (source: string, el: HTMLElement) => {
    const root = createRoot(el);
    root.render(
      <React.StrictMode>
        <Markline markdown={source} theme={this.settings.theme} showAge={this.settings.showAge} />
      </React.StrictMode>
    );
  }
}