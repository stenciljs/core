import { fork } from 'child_process';
import path from 'path';

import type * as d from '../declarations';

export function initServerProcessWorkerProxy(sendToMain: (msg: d.DevServerMessage) => void) {
  const workerPath = require.resolve(path.join(__dirname, 'server-worker-thread.js'));

  const filteredExecArgs = process.execArgv.filter((v) => !/^--(debug|inspect)/.test(v));

  const forkOpts: any = {
    execArgv: filteredExecArgs,
    env: process.env,
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
  };

  // start a new child process of the CLI process
  // for the http and web socket server
  let serverProcess = fork(workerPath, [], forkOpts);

  const receiveFromMain = (msg: d.DevServerMessage) => {
    // get a message from main to send to the worker
    if (serverProcess) {
      serverProcess.send(msg);
    } else if (msg.closeServer) {
      sendToMain({ serverClosed: true });
    }
  };

  // get a message from the worker and send it to main
  serverProcess.on('message', (msg: d.DevServerMessage) => {
    if (msg.serverClosed && serverProcess) {
      serverProcess.kill('SIGINT');
      serverProcess = null;
    }
    sendToMain(msg);
  });

  serverProcess.stdout.on('data', (data: any) => {
    // the child server process has console logged data
    console.log(`dev server: ${data}`);
  });

  serverProcess.stderr.on('data', (data: any) => {
    // the child server process has console logged an error
    sendToMain({ error: { message: 'stderr: ' + data } });
  });

  return receiveFromMain;
}
