const consoleNoop = () => {
  /**/
};

export function createConsole(): any {
  return {
    debug: consoleNoop,
    error: consoleNoop,
    info: consoleNoop,
    log: consoleNoop,
    warn: consoleNoop,
    dir: consoleNoop,
    dirxml: consoleNoop,
    table: consoleNoop,
    trace: consoleNoop,
    group: consoleNoop,
    groupCollapsed: consoleNoop,
    groupEnd: consoleNoop,
    clear: consoleNoop,
    count: consoleNoop,
    countReset: consoleNoop,
    assert: consoleNoop,
    profile: consoleNoop,
    profileEnd: consoleNoop,
    time: consoleNoop,
    timeLog: consoleNoop,
    timeEnd: consoleNoop,
    timeStamp: consoleNoop,
    context: consoleNoop,
    memory: consoleNoop,
  };
}
