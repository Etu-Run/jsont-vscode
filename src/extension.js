"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const { request } = require("http");
const vscode = require("vscode");
let myStatusBarItem;

let content = ''

function activate({ subscriptions }) {
    // register a command that is invoked when the status bar
    // item is selected
    const myCommandId = 'sample.showSelectionCount';
    subscriptions.push(vscode.commands.registerCommand(myCommandId, () => {
			
				const data = extractJson();
				if (!data) {
						vscode.window.showErrorMessage('The content should be a valid JSON like {..} or [..]');
						return;
				}
				sendShareReq(data);
				// vscode.window.showInformationMessage(data);
    }));


		// 选中JSON后底部的显示的分享图标
    // create a new status bar item that we can now manage
    myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.left, 0);
		myStatusBarItem.tooltip = 'Share JSON online'
    myStatusBarItem.command = myCommandId;
    subscriptions.push(myStatusBarItem);

	
    // register some listener that make sure the status bar 
    // item always up-to-date
    subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem));
    subscriptions.push(vscode.window.onDidChangeTextEditorSelection(updateStatusBarItem));
    // update status bar item once at start
    updateStatusBarItem();
}
exports.activate = activate;

// 从选中的内容中提取JSON
function extractJson() {
		// 必须以 { 或者 [ 开头 以 } 或者 ] 结尾
		if (!/^(\s|[\r\n])*\{(.|[\r\n])+\}(\s|[\r\n])*$/.test(content) && !/^(\s|[\r\n])*\[(.|[\r\n])+\](\s|[\r\n])*$/.test(content)) {
			return false
		};
		try {
				// 可以直接转换的 { "name": "json" }
				return JSON.stringify(JSON.parse(content), null, 4);
		} catch (e) {
				// 代码形式的  { name: 'json' } 在沙箱中进行验证
				try {
						const vm = require('vm');
						const context = {};
						const script = new vm.Script(`var json=${content}`);
						vm.createContext(context);
						script.runInContext(context);
						return JSON.stringify(context.json, null, 4);
				} catch (e) {
						return false;
				}
		}
}

// 发送请求
function sendShareReq(data) {
	const postData = JSON.stringify({
		content: data
	});

	myStatusBarItem.text = '$(loading~spin)'

	// 发送请求
	const req = request({
		hostname: 'api.jsont.run',
		port: 80,
		path: '/json/share',
		method: 'POST',
		headers: {
				'Content-Type': 'application/json',
				'Content-Length': Buffer.byteLength(postData)
		}
	},  (res) => {
			res.setEncoding('utf8');
			res.on('data', (chunk) => {
					vscode.window.showInformationMessage(`Share Success：http://jsont.run/${JSON.parse(chunk).data}`);
					myStatusBarItem.text = `$(live-share)`;
			});
			res.on('end', () => {
			});
	})
	req.on('error', (e) => {
			vscode.window.showErrorMessage(e.message);
	});
	req.write(postData);
	req.end();
}

// 决定何时显示分享按钮
function updateStatusBarItem() {
		var editor = vscode.window.activeTextEditor;
		if (!editor) {
				return; // No open text editor
		}

		var selection = editor.selection;
		content = editor.document.getText(selection);

    if (content) {
        myStatusBarItem.text = `$(live-share)`;
        myStatusBarItem.show();
    }
    else {
        myStatusBarItem.hide();
    }
}
