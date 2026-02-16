import { NodeWorkerMain } from '../node-worker-main';

export class TestWorkerMain extends NodeWorkerMain {
  constructor(workerId: number) {
    super(workerId, null);
    this.fork();
  }

  override fork() {
    this.childProcess = {} as any;
  }
}
