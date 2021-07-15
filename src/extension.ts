// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as cp from 'child_process';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('python-macros.runCode', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user

		const editor = vscode.window.activeTextEditor;

		if (editor) {
			const document = editor.document;
			const selection = editor.selection;

			// const disablePromptString = "(lambda __g: (lambda __mod: [[[None for __g['EmptyPrompt'] in [((lambda b, d: d.get('__metaclass__', getattr(b[0], '__class__', type(b[0])))('EmptyPrompt', b, d))((Prompts,), (lambda __l: [__l for __l['out_prompt_tokens'], __l['out_prompt_tokens'].__name__ in [(lambda self: (lambda __l: [[] for __l['self'] in [(self)]][0])({}), 'out_prompt_tokens')]][0])({'__module__': __name__})))]][0] for __g['os'] in [(__import__('os', __g, __g))]][0] for __g['Prompts'], __g['Token'] in [(__mod.Prompts, __mod.Token)]][0])(__import__('IPython.terminal.prompts', __g, __g, ('Prompts', 'Token'), 0)))(globals());ip = get_ipython();ip.prompts = EmptyPrompt(ip);"

			const selectedText = document.getText(selection);

			const ipython = cp.spawn('ipython', ['--no-pprint', '-c', ' ' + selectedText + ' ']);

			let output = '';
			let error = '';
			ipython.stdout.on('data', (chunk) => {
				output += chunk.toString();
			});
			ipython.stderr.on('data', (chunk) => {
				error += chunk.toString();
			});

			ipython.on('exit', () => {
				if (error.length === 0) {
					editor.edit(editBuilder => {
						editBuilder.replace(selection, output.replace(/^\s*Out\[\d+\]:\s*|\s+$/g, ''));
					});
				} else {
					vscode.window.showInformationMessage(error);
				}
			});
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
