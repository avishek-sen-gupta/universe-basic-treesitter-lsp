import * as path from "path";
import { workspace, ExtensionContext, window } from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
} from "vscode-languageclient/node";

let client: LanguageClient | undefined;

export function activate(context: ExtensionContext) {
  const config = workspace.getConfiguration("universeBasic.lsp");
  const serverPath: string = config.get("serverPath", "");
  const projectPath: string = config.get("projectPath", "");

  let command: string;
  let args: string[];
  let cwd: string | undefined;

  if (serverPath) {
    command = serverPath;
    args = [];
  } else if (projectPath) {
    command = "poetry";
    args = ["run", "python", "-m", "universe_basic_lsp"];
    cwd = projectPath;
  } else {
    const defaultProjectPath = path.resolve(__dirname, "..", "..", "..");
    command = "poetry";
    args = ["run", "python", "-m", "universe_basic_lsp"];
    cwd = defaultProjectPath;
  }

  const outputChannel = window.createOutputChannel("UniVerse BASIC LSP");
  outputChannel.appendLine(`Starting LSP server: ${command} ${args.join(" ")}`);
  outputChannel.appendLine(`Working directory: ${cwd || "(none)"}`);

  // Inherit shell PATH so poetry/python are found
  const env = { ...process.env };
  const shell =
    process.env.SHELL || (process.platform === "win32" ? "cmd.exe" : "/bin/sh");

  const serverOptions: ServerOptions = {
    command,
    args,
    options: {
      cwd,
      env,
      shell: true,
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "universe-basic" }],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher("**/*.{bas,b,bp}"),
    },
    outputChannel,
  };

  client = new LanguageClient(
    "universeBasicLSP",
    "UniVerse BASIC Language Server",
    serverOptions,
    clientOptions
  );

  client.start().catch((err) => {
    outputChannel.appendLine(`Failed to start server: ${err.message}`);
    window.showErrorMessage(
      `UniVerse BASIC LSP failed to start. Check Output > "UniVerse BASIC LSP" for details.`
    );
  });
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
