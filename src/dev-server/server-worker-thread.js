const { initServerProcess } = require('./server-process.js');
let closeTmr = null;

const sendHandle = (err) => {
  if (err && err.code === 'ERR_IPC_CHANNEL_CLOSED') {
    process.exit(0);
  }
};

const receiveMessageFromMain = initServerProcess((msg) => {
  // send message from worker going to main
  process.send(msg, sendHandle);

  if (msg.serverClosed) {
    clearTimeout(closeTmr);
    process.exit(0);
  }
});

process.on('message', (msg) => {
  // receive a message from the main going to worker
  if (msg && msg.closeServer) {
    closeTmr = setTimeout(() => {
      // force exiting if we timeout
      process.exit(0);
    }, 5000);
  }

  receiveMessageFromMain(msg);
});

process.on('unhandledRejection', (e) => {
  process.send(
    {
      error: { message: 'unhandledRejection: ' + e, stack: typeof e.stack === 'string' ? e.stack : null },
    },
    sendHandle,
  );
});
