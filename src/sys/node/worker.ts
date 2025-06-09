import * as coreCompiler from '@stencil/core/compiler';
import * as nodeApi from '@sys-api-node';

import { initNodeWorkerThread } from './node-worker-thread';

// this module is the entry point for the node.js workers that we create using
// `child_process.fork`. They receive messages from the main thread and
// communicate their responses using IPC.

const nodeSys = nodeApi.createNodeSys({ process: process });
// create a message handler which processes the messages that this worker
// thread will receive (via IPC) from the main thread
const msgHandler = coreCompiler.createWorkerMessageHandler(nodeSys);

initNodeWorkerThread(process, msgHandler);
