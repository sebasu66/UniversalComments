import * as vscode from 'vscode';
import * as langs from './langs'

let comments = new Map()
let triggerChars = new Array()
let longestComment = 0
let closeBlock = true
let addSpace = false
let middleLength = 5

function fileChanged(event: any) {
	let changes = event.contentChanges[0]

	if (!changes) {
		return
	}

	if (triggerChars.includes(changes.text)) {
		for (let i = 0; i < longestComment; i++) {
			if (changes.range.start.character - i < 0) {
				return
			}

			let position = new vscode.Position(changes.range.start.line, changes.range.start.character - i)
			let range = new vscode.Range(position, changes.range.end)
			let comment = event.document.getText(range) + changes.text

			if (comments.has(comment)) {
				let editor = vscode.window.activeTextEditor
				let currentLength = comment.length

				editor?.edit((builder) => {
					let type = comments.get(comment)
					position = new vscode.Position(position.line, position.character + currentLength)
					range = new vscode.Range(range.start, position)

					if (langs[event.document.languageId]) {
						comment = langs[event.document.languageId][type]
					}
					else {						
						return
					}					

					if (addSpace) {
						if (comment.length < middleLength) {
							if (type == 'multiEnd') {
								comment = ' ' + comment
							}
							else {
								comment += ' '
							}
							
						}
						else {
							let middle = Math.ceil(comment.length / 2)
							comment = [comment.slice(0, middle), '  ', comment.slice(middle)].join('')
						}
					}

					position = new vscode.Position(position.line, position.character + ((comment.length < middleLength ? comment.length : Math.ceil(comment.length / 2)) - currentLength))

					if (closeBlock && type == 'multiStart') {
						comment += (addSpace ? ' ' : '') + langs[event.document.languageId]['multiEnd']
					}

					builder.replace(range, comment)
					
					setTimeout(() => {
						editor!.selection = new vscode.Selection(position, position)
					}, 1);
					
				})

				break
			}
		}
	}
}

function updateConfig() {
	let commentSettings = vscode.workspace.getConfiguration('universal-comments.comments')
	let miscSettings = vscode.workspace.getConfiguration('universal-comments.misc')

	comments = new Map()
	triggerChars = new Array()
	longestComment = 0

	comments.set(commentSettings.get('singleLine'), 'single')
	comments.set(commentSettings.get('multiLineStart'), 'multiStart')
	comments.set(commentSettings.get('multiLineEnd'), 'multiEnd')

	addSpace = miscSettings.get('addSpace') || false
	closeBlock = miscSettings.get('closeBlock') || true

	if (addSpace) {
		middleLength = 6
	}
	else {
		middleLength = 5
	}

	comments.forEach((_, key) => {
		let triggerChar = key.slice(-1)

		if (!triggerChars.includes(triggerChar)) {
			triggerChars.push(triggerChar)
		}

		if (key.length > longestComment) {
			longestComment = key.length
		}
	}) 
}

export function activate() {
	updateConfig()

	vscode.workspace.onDidChangeConfiguration(updateConfig)
	vscode.workspace.onDidChangeTextDocument(fileChanged)
}