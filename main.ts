import { App, Plugin, PluginSettingTab, Setting, TFile } from "obsidian";
import * as os from "os";
import * as path from "path";
import { exec, ExecException } from "child_process";

const runCMD = (cmd: string) => {
	exec(cmd, (error: ExecException, stdout: string, stderr: string) => {
		if (error) {
			console.error(`run cmd err: ${error}, ${stdout}, ${stderr}`);
			return;
		}
		console.log(`run cmd output`, cmd);
	});
};

interface OpenFilePluginSettings {
	codeBinaryPath: string;
	gvimBinaryPath: string;
	editors: { name: string; path: string }[];
}

const DEFAULT_SETTINGS: OpenFilePluginSettings = {
	codeBinaryPath:
		"/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code",
	gvimBinaryPath: "/usr/local/bin/gvim",
	editors: [
		{
			name: "Visual Studio Code (vscode)",
			path: "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code",
		},
	],
};

export default class OpenFilePlugin extends Plugin {
	settings: OpenFilePluginSettings;
	async onload() {
		await this.loadSettings();
		this.addCommand({
			id: "open-in-other-editor-gvim",
			name: "Open current active file in gVim",
			callback: () => {
				this.open("gvim");
			},
		});

		this.addCommand({
			id: "open-in-other-editor-vscode",
			name: "Open current active file in VScode",
			callback: () => {
				this.open("code");
			},
		});

		this.addSettingTab(new OpenFileSettingsModal(this.app, this));
	}

	onunload() {}

	private open(by: "gvim" | "code") {
		const absoluteFilePath = (activeFile: TFile | null) => {
			// The last open file is closed, no currently open files
			if (!activeFile) {
				return;
			}

			const relativePath = activeFile.path;
			//@ts-ignore
			const vaultPath = this.app.vault.adapter.basePath;
			const absolutePath = path.join(vaultPath, relativePath);

			return absolutePath;
		};
		const curFilePath = absoluteFilePath(
			this.app.workspace.getActiveFile()
		);
		console.log("curFilePath", curFilePath);
		if (!curFilePath) {
			console.warn("no active file in workspace");
			return;
		}

		const program =
			by === "gvim"
				? this.settings.gvimBinaryPath
				: this.settings.codeBinaryPath;

		if (os.type() === "Windows_NT") {
			runCMD(`cd /d && ${program} "${curFilePath}"`);
		} else {
			runCMD(`${program} "${curFilePath}"`);
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// class SampleModal extends Modal {
// 	constructor(app: App) {
// 		super(app);
// 	}

// 	onOpen() {
// 		const { contentEl } = this;
// 		contentEl.setText("Woah!");
// 	}

// 	onClose() {
// 		const { contentEl } = this;
// 		contentEl.empty();
// 	}
// }

class OpenFileSettingsModal extends PluginSettingTab {
	plugin: OpenFilePlugin;

	constructor(app: App, plugin: OpenFilePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Open In Editor" });

		new Setting(containerEl)
			.setName("VSCode binary path")
			.setDesc("Absolute path to `code` on your system")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.codeBinaryPath)
					.setValue(this.plugin.settings.codeBinaryPath)
					.onChange(async (value) => {
						console.log("Value:", value);
						this.plugin.settings.codeBinaryPath = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
