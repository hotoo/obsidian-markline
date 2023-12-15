import * as React from "react";
import type { IEvent, IGroup, IMarklineData, IProcessHandlers } from './types';

// const offset_top = 20; // offset top for date header.
const offset_left = 30; // offset left for group name.
const year_width = 100; // width per date (year).

interface TimelineProps {
  data: IMarklineData;
}
interface TimelineState {
  scrollTop: number;
  scrollLeft: number;
  mouseStartX: number;
  mouseStartY: number;
  viewStartX: number;
  viewStartY: number;
  dragging: boolean;
}

export class Timeline extends React.Component<TimelineProps, TimelineState> {
  refRoot: any;
  refDates: any;
  refBody: any;
  max_width: number;

  constructor(props: TimelineProps) {
    super(props);
    this.refRoot = React.createRef();
    this.refDates = React.createRef();
    this.refBody = React.createRef();
    this.state = {
      scrollTop: 0,
      scrollLeft: 0,
      mouseStartX: 0,
      mouseStartY: 0,
      viewStartX: 0,
      viewStartY: 0,
      dragging: false,
    };
  }

  _process (data: IGroup[], handlers: IProcessHandlers) {
    if (!handlers) {return;}

    for (let g = 0, gl = data.length; g < gl; g++) {
      const group = data[g];

      const lines = group.events;

      if (isFunction(handlers["group:start"])) {
        // @ts-ignore
        handlers["group:start"].call(this, group, lines);
      }

      for(let i = 0, l = lines.length; i < l; i++) {
        const line = lines[i];

        if (isFunction(handlers["line:start"])) {
          // @ts-ignore
          handlers["line:start"].call(this, line);
        }

        if (line.events) {
          for (let j = 0, m = line.events.length; j < m; j++) {
            if (isFunction(handlers["event"])) {
              // @ts-ignore
              handlers["event"].call(this, line.events[j]);
            }
          }
        }

        if (isFunction(handlers["line:stop"])) {
          // @ts-ignore
          handlers["line:stop"].call(this, line);
        }
      }

      if (isFunction(handlers["group:stop"])) {
        // @ts-ignore
        handlers["group:stop"].call(this, group, lines);
      }
    }
  }

  onScroll = (evt: any) => {
    const { scrollTop, scrollLeft } = evt.currentTarget;
    this.setState({
      scrollLeft,
      scrollTop,
    });
  }

  onMouseDown = (evt: any) => {
    const { clientX, clientY } = evt;
    this.setState({
      mouseStartX: clientX,
      mouseStartY: clientY,
      viewStartX: this.state.scrollLeft,
      viewStartY :this.state.scrollTop,
      dragging: true,
    });
    evt.preventDefault();
    evt.stopPropagation();
  }
  onMouseMove = (evt: any) => {
    if (!this.state.dragging) {
      return false;
    }
    const {
      mouseStartX,
      mouseStartY,
      viewStartX,
      viewStartY,
    } = this.state;
    let x = viewStartX + (mouseStartX - evt.clientX);
    if (x < 0) { x = 0; }
    // TODO: - container_width;
    const rect = this.refRoot.current?.getBoundingClientRect();
    const { width: rootWidth = 0 } = rect;
    if (x > this.max_width - rootWidth) { x = this.max_width - rootWidth + 90; }

    let y = viewStartY + (mouseStartY - evt.clientY);
    y = y >= 0 ? y : 0;
    this.setState({
      scrollTop: y,
      scrollLeft: x,
    });
    this.refBody.current.scrollLeft = x;
    this.refBody.current.scrollTop = y;
    evt.preventDefault();
    evt.stopPropagation();
  }
  onMouseUp = (evt: any) => {
    this.setState({
      dragging: false,
    });
    evt.preventDefault();
    evt.stopPropagation();
  }

  render() {
    const { data } = this.props;

    let min_date = new Date();
    let max_date = new Date();

    this._process(data.body, {
      "line:start": function(line: IEvent){
        const date_start = line["date-start"];
        const date_end = line["date-end"];

        if (!min_date || date_start < min_date) {
          min_date = date_start;
        }

        if (!max_date || max_date < date_end) {
          max_date = date_end;
        }
      }
    });

    const first_year = min_date.getFullYear();
    const last_year = max_date.getFullYear() + 2;
    const years = last_year - first_year + 3;
    this.max_width = years * year_width + 90;

    min_date = new Date(first_year, 0, 1);

    // HEAD: dates
    const head_dates = ['<ol>'];

    for(let year=first_year, age=0; year<=last_year; year++, age++){
      head_dates.push('<li><label>', String(year), data.meta.age === "show" ? ' ('+ age +')' : '', '</label></li>')
    }

    head_dates.push('</ol>');

    // BODY: events groups, and events.
    const body_events = [''];
    let current_line_offset_left = 0;

    this._process(data.body, {
      "group:start": function(group: IGroup){
        const style = `background-color: ${group["background-color"]}; color: ${group["text-color"]}`;
        body_events.push(
          `<div class="groups" style="width:${this.max_width}px; ${style}">`,
            '<label style="left: ', String(this.state.scrollLeft - 90), `px; background-color: ${group["background-color"]}">`, group.html, '</label>',
            '<ol>'
        );
      },

      "group:stop": function(){
        body_events.push(
            '</ol>',
          '</div>'
        );
      },

      "line:start": function(line: IEvent){
        const date_start = line["date-start"];
        const date_end = line["date-end"];
        const line_start = calcLength(Number(date_start) - Number(min_date)) + offset_left;
        current_line_offset_left = Number(date_start);
        let line_length = calcLength(Number(date_end) - Number(date_start));
        if (line_length < 8) {
          line_length = 8;
          //line_start -= 4;
        }

        body_events.push(
          '<li style="margin-left:', String(line_start), 'px; color:', line["text-color"] || '', '">',
            '<div>',
              '<ol style="width:', String(line_length), 'px; background-color:', line["background-color"] || '', ';">');
      },

      'line:stop': function(line: IEvent){
        body_events.push(
              '</ol>',
              '<time>', line.date, '</time>',
              '<label>', line.name, '</label>',
            '</div>',
          '</li>'
        );
      },

      "event": function(event){
        let event_start = calcLength(Number(event["date-start"]) - current_line_offset_left);
        let event_width = calcLength(Number(event["date-end"]) - Number(event["date-start"]));
        if (event_width < 8) {
          event_width = 8;
          event_start -= 4;
        }
        body_events.push('<li style="left:', String(event_start), 'px;width:', String(event_width), 'px" title="', event.date, ' ', event.name, '"></li>');
      }
    });

    return (
      <div className={`markline markline-${data.meta.theme}`} ref={this.refRoot}>
        <header dangerouslySetInnerHTML={{ __html: data.title || ''}}></header>
        <section
          onMouseDownCapture={this.onMouseDown}
          onMouseMoveCapture={this.onMouseMove}
          onMouseUpCapture={this.onMouseUp}
        >
          <div 
            className="dates"
            ref={this.refDates}
            style={{ left: -this.state.scrollLeft }}
            dangerouslySetInnerHTML={{ __html: head_dates.join('') }}
          />
          <div
            className="events"
            ref={this.refBody}
            onScroll={this.onScroll}
            dangerouslySetInnerHTML={{ __html: body_events.join('') }}
          />
        </section>
        <footer>
          <a className="forkme" href="https://github.com/hotoo/obsidian-markline" target="_blank">Markline</a>
        </footer>
      </div>
    )
  }
}

// @param {Number} distance, two date distance milliseconds.
// @return {Number} line width.
function calcLength(distance: number){
  const len = (distance / (24 * 60 * 60 * 1000)) * year_width / 365.24;
  return Math.round(len);
}

function isFunction(object: any): boolean {
  return Object.prototype.toString.call(object) === "[object Function]";
}
