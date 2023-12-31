import { App, Editor, MarkdownView, Plugin, PluginSettingTab, Setting } from 'obsidian';
// import { MarklineView, VIEW_TYPE_MARKLINE } from "./MarklineView";
import { MarklinePluginSettings } from './types';
import { Processor } from './processor';

const DEFAULT_SETTINGS: MarklinePluginSettings = {
	showAge: false,
	theme: 'dark',
}

export default class MarklinePlugin extends Plugin {
	settings: MarklinePluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'add-markline-blockquote',
			name: 'Add markline blockquote',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				// console.log(editor.getSelection());
				editor.replaceSelection('```markline\n- 2023-12-01~ demo\n- 2023 more information see [obsidian-markline](https://github.com/hotoo/obsidian-markline).\n```');
			}
		});

    // this.registerView(
    //   VIEW_TYPE_MARKLINE,
    //   (leaf) => new MarklineView(leaf)
    // );
    // this.addRibbonIcon("dice", "Active Markline view", () => {
    //   this.activateView();
    // });

		// 渲染 markline 组件
		const processor = new Processor(this.settings);
    this.registerMarkdownCodeBlockProcessor("markline", processor.render);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MarklineSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
		// this.app.workspace.detachLeavesOfType(VIEW_TYPE_MARKLINE);
	}

	// Active Markline View.
	//async activateView() {
	//	this.app.workspace.detachLeavesOfType(VIEW_TYPE_MARKLINE);

	//	await this.app.workspace.getRightLeaf(false).setViewState({
	//		type: VIEW_TYPE_MARKLINE,
	//		active: true,
	//	});

	//	try {
	//	this.app.workspace.revealLeaf(
	//		this.app.workspace.getLeavesOfType(VIEW_TYPE_MARKLINE)[0]
	//	);

	//	} catch(ex) {
	//	alert('ex' + ex.message);
	//	}
	//}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


class MarklineSettingTab extends PluginSettingTab {
	plugin: MarklinePlugin;

	constructor(app: App, plugin: MarklinePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Markline show age')
			.setDesc('show age number after date.')
			.addToggle(text => text
				.setValue(this.plugin.settings.showAge)
				.onChange(async (value: boolean) => {
					this.plugin.settings.showAge = value;
					await this.plugin.saveSettings();
				})
			);
		new Setting(containerEl)
			.setName('Theme')
			.setDesc('markline view theme')
			.addDropdown(dropDown => {
				dropDown.addOption('dark', 'Dark');
				dropDown.addOption('light', 'Light');
				dropDown.setValue(this.plugin.settings.theme);
				dropDown.onChange(async (value: 'light' | 'dark') =>	{
					this.plugin.settings.theme = value;
					await this.plugin.saveSettings();
				})}
			);
	}
}
