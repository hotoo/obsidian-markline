
export interface MarklinePluginSettings {
	showAge: boolean;
	theme: 'light' | 'dark';
}

export interface IMarklineData {
	title: string; // 图表标题，显示在左下角。
	meta: IMetadata;
	body: Record<string, any>; // TODO: 转换成数组形式
}

export interface IGroup {
	name: string;
	tags: string[];
}
export interface ILine {
	events: IEvent[]
}
export interface IEvent {
  name: string;
  date: string;
  'date-start': Date;
  'date-end': Date;
	tags?: string[];
	'background-color'?: string;
	'text-color'?: string;
}

export interface MarklineData {
	[group_name: string]: {
		lines: ILine[];
		tags: ITag[];
	}
}

export interface IProcessHandlers {
  'group:start'?: (group_name: string) => void;
  'group:stop'?: (group_name: string) => void;
  'line:start'?: (line: IEvent) => void;
  'line:stop'?: (line: IEvent) => void;
  event?: (event: IEvent) => void;
}

export interface IMetadata {
	author?: string;
	mention?: string;
	tags?: ITag[];
	age?: 'show' | 'hide';
	theme?: 'dark' | 'light';
	[meta: string]: any;
}

export interface ITags {
	[tag_name: string]: ITag;
}

export interface ITag {
		backgroundColor: string;
		textColor: string;
}