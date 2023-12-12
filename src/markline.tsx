import * as React from "react";
import { Timeline, IEvent } from "./timeline";

const DEFAULT_MENTION_URL = "https://github.com/{@mention}";

function isString (object: any){
  return Object.prototype.toString.call(object) === "[object String]";
}

interface IMarklineProps {
  markdown: string;
  showAge: boolean;
  theme: 'dark' | 'light';
}

export class Markline extends React.Component<IMarklineProps> {
  render() {
    const {markdown, showAge, theme} = this.props;
    const data = parse(markdown);
    if (showAge && data.meta.age !== 'show') {
      data.meta.age = 'show';
    }
    if (theme && !data.meta.theme) {
      data.meta.theme = theme;
    }
    return (
      <Timeline data={data} />
    )
  }
}

// @param {String} date
function parseDate(date_string?: string): Date {

  if (!date_string) {
    return new Date();
  }

  //              year          month           date            hour         minute       second
  const RE_DATE = /^(\d{4})(?:[/-](\d{1,2})(?:[/-](\d{1,2})(?:[T ](\d{1,2})(?::(\d{1,2})(?::(\d{1,2}))?)?)?)?)?$/;

  const match = date_string.match(RE_DATE);
  // TODO: NaN | null
  if (!match){return new Date();}

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2] || '1', 10) - 1;
  const date = parseInt(match[3] || '1');
  const hour = parseInt(match[4] || '0');
  const minute = parseInt(match[5] || '0');
  const second = parseInt(match[6] || '0');
  return new Date(year, month, date, hour, minute, second);
}

// @param {String} date.
function parseDateEnd(date: string): Date {

  const RE_YEAR = /^\d{4}$/;
  const RE_MONTH = /^\d{4}[/-]\d{1,2}$/;
  // const RE_DATE = /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/;

  const dt = parseDate(date);

  if (RE_YEAR.test(date)) {
    dt.setFullYear(dt.getFullYear() + 1);
  } else if (RE_MONTH.test(date)) {
    if (dt.getMonth() === 11) {
      dt.setFullYear(dt.getFullYear() + 1);
      dt.setMonth(0);
    } else {
      dt.setMonth(dt.getMonth() + 1);
    }
  }

  return dt;
}

// parse simple markdown.
// @param {String} markdown.
// @return {String} html tags.
// TODO: meta types.
function parseMarkdown(markdown: string, meta: any){
  const RE_IMAGE = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const RE_LINK = /\[([^\]]*)\]\(([^)]+)\)/g;
  const RE_STRONG = /(\*\*|__)(.*?)\1/g;
  const RE_EM = /(\*|_)(.*?)\1/g;
  const RE_DELETE = /(~~?)(.*?)\1/g;
  const RE_CODE = /`([^`]+)`/g
  const RE_MENTION = /(^|[^a-zA-Z0-9])@([^\s\t,()[\]{}]+)/g;
  const RE_MENTION_PLACEHOLDER = /\{@mention\}/ig;
  const RE_HASHTAG = /(?:^|[\s\t])#([^\s\t]+)/g;

  let html = markdown.replace(RE_IMAGE, '<a href="$2" class="img" title="$1" target="_blank"><i style="background-image:url($2)" /></a>');
  html = html.replace(RE_LINK, '<a href="$2" target="_blank">$1</a>');
  html = html.replace(RE_STRONG, '<strong>$2</strong>');
  html = html.replace(RE_EM, '<em>$2</em>');
  html = html.replace(RE_DELETE, '<del>$2</del>');
  html = html.replace(RE_CODE, '<code>$1</code>');

  // mention:
  if (meta.mention) {
    html = html.replace(RE_MENTION, function($0, prefix, mention_name){
      const mention_url = meta.mention || DEFAULT_MENTION_URL;
      return prefix + '<a href="' +
        mention_url.replace(RE_MENTION_PLACEHOLDER, mention_name) +
        '" target="_blank">@' + mention_name + '</a>';
    });
  }

  // #hashtags:
  html = html.replace(RE_HASHTAG, function($0, $1_tag_name){
    const tag_colors = meta.tags || meta.tag || {};
    let style;

    if (tag_colors.hasOwnProperty($1_tag_name)) {
      const tag_color = (tag_colors[$1_tag_name] || "").split(/,[\s\t]+/);
      const color = tag_color[0];
      const bg_color = tag_color[1];
      style =  ' style="color:' + color + ';background-color:' + bg_color + ';"';
    }
    return '<span class="tags"' + style + '>#' + $1_tag_name + '</span>';
  });

  return html;
}

// parse markline.
function parse(markdown: string){
  const lines = markdown.split(/\r\n|\r|\n/);
  const data: {
    title: string;
    meta: Record<string, any>;
    body: Record<string, any>;
  } = {
    title: "",
    meta: {},
    body: {},
  };

  const re_title = /^#\s+(.*)$/;
  const re_meta = /^[+\-*]\s+([^:]+):\s*(.*)$/;
  const re_submeta = /^[\s\t]+[-*]\s+([^:]+):\s*(.*)$/;
  const re_hr = /^-{2,}$/;
  const re_group = /^##{1,5}\s+(.*)$/;
  const re_line  = /^[+*-]\s+(([0-9/-]+)(?:~([0-9/-]*))?)\s+(.*)$/;
  const re_event  = /^\s+[+*-]\s+(([0-9/-]+)(?:~([0-9/-]*))?)\s+(.*)$/;

  let current_group = "";
  let current_line;
  let inline = false; // into group, line, or event body.
  let inmeta = false;
  let current_meta_name = '';
  let current_meta_value;

  function addGroup(group_name: string){
    while (data.body.hasOwnProperty(group_name)) {
      group_name += " ";
    }
    current_group = parseMarkdown(group_name, data.meta);
    data.body[current_group] = [];

    inline = true;
  }

  for(let i=0,l=lines.length; i<l; i++){
    const text_line = lines[i];
    let match = text_line.match(re_title);
    if (match){
      // PARSE TITLE.
      data.title = parseMarkdown(match[1], data.meta);
    } else if (!inline && (match = text_line.match(re_meta))) {
      const meta_name = match[1];
      const meta_value = match[2];
      data.meta[meta_name] = meta_value;
      current_meta_name = meta_name;
      current_meta_value = meta_value;
      inmeta = true;
    } else if (!inline && (match = text_line.match(re_submeta))) {

      if (isString(data.meta[current_meta_name])) {
        data.meta[current_meta_name] = {
          "default": current_meta_value
        };
      }

      const meta_name = match[1];
      const meta_value = match[2];
      data.meta[current_meta_name][meta_name] = meta_value;
      // eslint-disable-next-line
      inmeta = true;
    } else if (text_line.match(re_hr)){
      addGroup("");
    // eslint-disable-next-line no-cond-assign
    } else if (match = text_line.match(re_group)){
      // PARSE GRPUPS.
      const group_name = match[1];
      addGroup(group_name);
    // eslint-disable-next-line no-cond-assign
    } else if (match = text_line.match(re_line)){
      // PARSE EVENT LINES.

      if (!data.body[current_group]){
        data.body[current_group] = [];
      }

      const line_start = match[2];
      const line_stop = match[3] === undefined ? line_start : match[3];
      const line_name = match[4];
      const data_line = {
        "date": match[1],
        "date-start": parseDate(line_start),
        "date-end": parseDateEnd(line_stop),
        "name": parseMarkdown(line_name, data.meta),
        "events": [] as IEvent[],
      };
      data.body[current_group].push(data_line);
      current_line = data_line;

      inline = true;
    // eslint-disable-next-line no-cond-assign
    } else if (match = text_line.match(re_event)) {
      // PARSE SUB EVENT POINTS.

      const date = match[1];
      const date_start = match[2];
      const date_end = match[3] === undefined ? date_start : match[3];
      const name = match[4];

      current_line?.events.push({
        "date": date,
        "date-start": parseDate(date_start),
        "date-end": parseDateEnd(date_end),
        "name": parseMarkdown(name, data.meta)
      });

      inline = true;
    }
  }

  return data;
}