import type * as d from '../../../declarations';
import { getNextWorker } from '../node-worker-controller';
import { TestWorkerMain } from './test-worker-main';

const incr = (function* () {
  let i = 1;
  while (true) {
    yield i++;
  }
})();

describe('getNextWorker', () => {
  let workers: TestWorkerMain[];
  const maxConcurrentWorkers = 4;

  const stubCompilerWorkerTask = (): d.CompilerWorkerTask => {
    return {
      stencilId: incr.next().value,
      resolve: () => {},
      reject: () => {},
      inputArgs: [],
      retries: 1,
    };
  };

  beforeEach(() => {
    workers = [];
    for (let i = 0; i < maxConcurrentWorkers; i++) {
      const worker = new TestWorkerMain(i);
      workers.push(worker);
    }
  });

  it('get worker with fewest total tasks assigned when all the same number of tasks', () => {
    workers[0].tasks.set(1, stubCompilerWorkerTask());
    workers[0].tasks.set(2, stubCompilerWorkerTask());
    workers[0].tasks.set(3, stubCompilerWorkerTask());
    workers[0].totalTasksAssigned = 50;

    workers[1].tasks.set(1, stubCompilerWorkerTask());
    workers[1].tasks.set(2, stubCompilerWorkerTask());
    workers[1].tasks.set(3, stubCompilerWorkerTask());
    workers[1].totalTasksAssigned = 40;

    // this one is tied for fewest active tasks (3)
    // but has the fewest total tasks assigned (30)
    workers[2].tasks.set(1, stubCompilerWorkerTask());
    workers[2].tasks.set(2, stubCompilerWorkerTask());
    workers[2].tasks.set(3, stubCompilerWorkerTask());
    workers[2].totalTasksAssigned = 30;

    workers[3].tasks.set(1, stubCompilerWorkerTask());
    workers[3].tasks.set(2, stubCompilerWorkerTask());
    workers[3].tasks.set(3, stubCompilerWorkerTask());
    workers[3].tasks.set(4, stubCompilerWorkerTask());
    workers[3].tasks.set(5, stubCompilerWorkerTask());
    workers[3].totalTasksAssigned = 20;

    const w = getNextWorker(workers);

    expect(w).toBeDefined();
    expect(w!.id).toBe(2);
  });

  it('get first worker when all the same', () => {
    workers[0].tasks.set(1, stubCompilerWorkerTask());
    workers[0].totalTasksAssigned = 1;
    workers[1].tasks.set(1, stubCompilerWorkerTask());
    workers[1].totalTasksAssigned = 1;
    workers[2].tasks.set(1, stubCompilerWorkerTask());
    workers[2].totalTasksAssigned = 1;
    workers[3].tasks.set(1, stubCompilerWorkerTask());
    workers[3].totalTasksAssigned = 1;

    const w = getNextWorker(workers);

    expect(w).toBeDefined();
    expect(w!.id).toBe(0);
  });

  it('forth task', () => {
    workers[0].tasks.set(1, stubCompilerWorkerTask());
    workers[1].tasks.set(1, stubCompilerWorkerTask());
    workers[2].tasks.set(1, stubCompilerWorkerTask());

    const w = getNextWorker(workers);

    expect(w).toBeDefined();
    expect(w!.id).toBe(3);
  });
});
