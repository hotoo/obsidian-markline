
export interface MarklinePluginSettings {
	showAge: boolean;
	theme: 'light' | 'dark';
}

export interface IMarklineData {
	title: string; // 图表标题，显示在左下角。
	meta: IMetadata;
	body: IGroup[]; // TODO: 转换成数组形式
}

export interface IGroup {
	html: string;
	tags?: string[];
	'background-color'?: string;
	'text-color'?: string;
	events: ILine[];
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

export interface ILine extends IEvent {
	events: IEvent[]
}

export interface IProcessHandlers {
  'group:start'?: (group: IGroup) => void;
  'group:stop'?: (group: IGroup) => void;
  'line:start'?: (line: ILine) => void;
  'line:stop'?: (line: ILine) => void;
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