import * as React from "react";

// const offset_top = 20; // offset top for date header.
const offset_left = 30; // offset left for group name.
const year_width = 100; // width per date (year).

interface IEvent {
  name: string;
  date: string;
  'date-start': Date;
  'date-end': Date;
}

interface IProcessHandlers {
  'group:start'?: (group_name: string) => void;
  'group:stop'?: (group_name: string) => void;
  'line:start'?: (line: IEvent) => void;
  'line:stop'?: (line: IEvent) => void;
  event?: (event: IEvent) => void;
}

interface MarklineData {
  title: string;
  meta: Record<string, any>;
  body: Record<string, any>;
}
interface TimelineProps {
  data: MarklineData;
}
interface TimelineState {
  scrollLeft: number;
}

export class Timeline extends React.Component<TimelineProps, TimelineState> {
  refDates: any;

  constructor(props: TimelineProps) {
    super(props);
    this.refDates = React.createRef();
    this.state = {
      scrollLeft: 0,
    };
  }

  _process (data: Record<string, any>, handlers: IProcessHandlers) {
    if (!handlers) {return;}

    for (const group_name in data) {
      if (!data.hasOwnProperty(group_name)) {continue;}

      const lines = data[group_name];

      if (isFunction(handlers["group:start"])) {
        // @ts-ignore
        handlers["group:start"].call(this, group_name, lines);
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
        handlers["group:stop"].call(this, group_name, lines);
      }
    }
  }

  onScroll = (evt: any) => {
    const scrollLeft = evt.currentTarget.scrollLeft;
    this.setState({
      scrollLeft,
    });

    // me.header.css({"left": -me.body.scrollLeft()});
    // const groups = $(".groups > label", me._element);
    // groups.css({"left": evt.scrollLeft - 90});
  }

  render() {
    const { data } = this.props;

    let min_date: Date;
    let max_date: Date;

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

    // @ts-ignore
    const first_year = min_date.getFullYear();
    // @ts-ignore
    const last_year = max_date.getFullYear() + 2;

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
      "group:start": function(group_name: string){
        body_events.push(
          '<div class="groups">',
            '<label>', group_name, '</label>',
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
          '<li style="margin-left:', String(line_start), 'px;">',
            '<div>',
              '<ol style="width:', String(line_length), 'px;">');
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
      <div className="markline">
        <header dangerouslySetInnerHTML={{ __html: data.title || ''}}></header>
        <section>
          <div className="dates" ref={this.refDates} style={{ left: -this.state.scrollLeft }} dangerouslySetInnerHTML={{ __html: head_dates.join('') }}></div>
          <div className="events" id="events" onScroll={this.onScroll} dangerouslySetInnerHTML={{ __html: body_events.join('') }}></div>
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


// Markline.prototype.render = function() {
// 
// 
//   const me = this;
// 
//   this._element.addClass("markline");
//   this.title = $(['<header>', this.title, '</header>'].join("")).appendTo(this._element);
//   this.footer = $(['<footer><a class="forkme" href="https://github.com/hotoo/markline" target="_blank">Markline</a></footer>'].join("")).appendTo(this._element);
//   this.container = $('<section></section>').appendTo(this._element);
//   this.header = $(head_dates.join("")).appendTo(this.container);
//   this.body = $(body_events.join("")).appendTo(this.container);

  // this.body.on("scroll", function(evt){
  //   const that = $(this);

  //   //var head = $(".dates", me._element);
  //   //head.css({"left": -that.scrollLeft()});
  //   me.header.css({"left": -me.body.scrollLeft()});

  //   const groups = $(".groups > label", me._element);
  //   groups.css({"left": that.scrollLeft() - 90});
  // });

  // // scroll via mouse drag and drop.
  // let startingMousePostition;
  // let startingPagePosition;
  // this.container.on('mousedown', function(event){
  //   startingMousePostition = {
  //     x: event.clientX,
  //     y: event.clientY
  //   };
  //   startingPagePosition = {
  //     x: me.body.scrollLeft(),
  //     y: me.body.scrollTop()
  //   };

  //   me.container.on('mousemove', drag);
  // });
  // this.container.on('mouseup', function(event){
  //   me.container.off('mousemove', drag);
  // });

  // function drag(event){
  //   event.preventDefault();
  //   const x = startingPagePosition.x + (startingMousePostition.x - event.clientX);
  //   const y = startingPagePosition.y + (startingMousePostition.y - event.clientY);
  //   me.body.scrollLeft(x);
  //   me.body.scrollTop(y);
  // }
// };

