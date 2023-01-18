import * as vscode from 'vscode';

function fileChanged(uri: any) {
	console.log(uri);
	
}

export function activate(context: vscode.ExtensionContext) {
	vscode.workspace.onDidChangeTextDocument(fileChanged)
}

export function deactivate() {}