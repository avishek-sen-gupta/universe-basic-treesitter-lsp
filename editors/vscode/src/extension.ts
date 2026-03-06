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
    // Use the configured server executable directly
    command = serverPath;
    args = [];
  } else if (projectPath) {
    // Use poetry in the project directory
    command = "poetry";
    args = ["run", "universe-basic-lsp"];
    cwd = projectPath;
  } else {
    // Default: assume the extension is inside the project repo
    const defaultProjectPath = path.resolve(__dirname, "..", "..", "..");
    command = "poetry";
    args = ["run", "universe-basic-lsp"];
    cwd = defaultProjectPath;
  }

  const serverOptions: ServerOptions = {
    command,
    args,
    options: cwd ? { cwd } : undefined,
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "universe-basic" }],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher("**/*.{bas,b,bp}"),
    },
  };

  client = new LanguageClient(
    "universeBasicLSP",
    "UniVerse BASIC Language Server",
    serverOptions,
    clientOptions
  );

  client.start().catch((err) => {
    window.showErrorMessage(
      `Failed to start UniVerse BASIC LSP server: ${err.message}`
    );
  });
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
