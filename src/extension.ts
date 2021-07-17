import * as vscode from 'vscode';
import * as cp from 'child_process';
import { Subject, zip } from 'rxjs';
import { skip, first } from 'rxjs/operators';

class Operation {
	constructor(command: string, callback: (response: string) => void) {
		this.command = command;
		this.callback = callback;
	}

	command: string;
	callback: (response: string) => void
}

class IPython {
	_ipython = cp.spawn('ipython', ['--no-pprint']);
	_operations = new Subject<Operation>();
	_outputs = new Subject<string>();

	constructor() {
		let currentOutput = '';
		let currentError = '';

		vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: 'Python Macros' }, p => {
			return new Promise<void>((resolve, reject) => {
				p.report({ message: 'Starting IPython...' });
				this._outputs.pipe(first()).subscribe((_) => resolve());
			});
		});

		this._ipython.stdout.on('data', (chunk) => {
			const chunkString: string = chunk.toString();
			const parts = chunkString.split(/In\s*\[\d+\]:/g);
			if (parts.length > 1) {
				currentOutput += parts[0];
				if (currentError == '') {
					this._outputs.next(currentOutput.replace(/^\s*/g, ''));
				} else {
					vscode.window.showInformationMessage(currentError);
					currentError = '';
				}
				currentOutput = '';
			} else if (chunkString.match(/\s*\.\.\.:/g)) {
				this._ipython.stdin.write('\n');
			} else {
				currentOutput += chunkString.replace(/^\s*Out\s*\[\d+\]:\s*/, '');
			}
		});

		this._ipython.stderr.on('data', (chunk) => {
			const chunkString: string = chunk.toString();
			currentError += chunkString;
		});

		zip(this._operations, this._outputs).subscribe(([operation, _]) => {
			this._ipython.stdin.write(operation.command + '\n');
		});

		zip(this._operations, this._outputs.pipe(skip(1))).subscribe(([operation, output]) => {
			operation.callback(output.replace(/^\s*Out\s*\[\d+\]:\s*/, ''));
		});
	}

	exec(command: string, callback: (response: string) => void) {
		command = command.replace(/\n+$/g, '');
		this._operations.next(new Operation(command, callback));
	}

	kill() {
		this._operations.complete();
		this._outputs.complete();
		this._ipython.kill();
	}
}

let ipython: IPython;

export function activate(context: vscode.ExtensionContext) {
	ipython = new IPython();

	let disposable = vscode.commands.registerCommand('python-macros.runCode', () => {
		const editor = vscode.window.activeTextEditor;

		if (editor) {
			const document = editor.document;
			const selection = editor.selection;

			const selectedText = document.getText(selection);

			ipython.exec(selectedText, (output) => {
				editor.edit(editBuilder => {
					editBuilder.replace(selection, output.replace(/\s+$/g, ''));
				});
			});
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {
	ipython.kill();
}
