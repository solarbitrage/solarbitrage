import pm2, { Proc, ProcessDescription, StartOptions } from 'pm2';
import { promisify } from 'util';
import { EventEmitter } from 'events';

export interface IProcessOutLog {
  data: string;
  at: number;
  process: {
    namespace: string;
    rev: string;
    name: string;
    pm_id: number;
  };
}

class Pm2Lib {
  //private readonly SCRIPT_PATH = process.env.SCRIPT_PATH;
  private readonly DATA_COLLECTION_SCRIPT_PATH = 'npm run --prefix ../backend/data_collection/'
  private readonly TRADING_BOT_SCRIPT_PATH = 'npm run --prefix ../backend/bot/'
  private readonly DATA_COLLECTION_PROCESSES = ['data-collection-orca', 'data-collection-raydium', 'listener'];
  private readonly TRADING_BOT_PROCESSES = ['trading-bot']

  private readonly PROCESSES = this.TRADING_BOT_PROCESSES.concat(this.DATA_COLLECTION_PROCESSES)

  private bus: EventEmitter | undefined;

  async getProcesses(): Promise<ProcessDescription[]> {
    const processes: ProcessDescription[] = [];

    for (const process of this.PROCESSES) {
      const [proc] = await promisify(pm2.describe).call(pm2, process);
      if (proc) {
        processes.push(proc);
      } else {
        processes.push({
          name: process,
          pm2_env: {
            status: 'stopped',
          },
        });
      }
    }

    return processes;
  }

  async startProcess(filename: string): Promise<Proc> {
    const proc = this.getStartOptions(filename);

    return promisify<StartOptions, Proc>(pm2.start).call(pm2, proc);
  }

  async restartProcess(filename: string): Promise<Proc> {
    return promisify(pm2.restart).call(pm2, filename);
  }

  async stopProcess(filename: string): Promise<Proc> {
    return promisify(pm2.stop).call(pm2, filename);
  }

  async onLogOut(onLog: (logObj: IProcessOutLog) => void) {
    if (!this.bus) {
      this.bus = await promisify<EventEmitter>(pm2.launchBus).call(pm2)
    }
    this.bus.on('log:out', (procLog: IProcessOutLog) => {
      onLog(procLog);
    });
  }

  private getStartOptions(filename: string): StartOptions {
    const alias = filename.replace('.js', '');
    const SCRIPT_PATH = this.DATA_COLLECTION_PROCESSES.includes(filename) ? this.DATA_COLLECTION_SCRIPT_PATH : this.TRADING_BOT_SCRIPT_PATH 
    return {
      script: `${SCRIPT_PATH} ${filename}`,
      name: filename,
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      output: `${SCRIPT_PATH}/${alias}.stdout.log`,
      error: `${SCRIPT_PATH}/${alias}.stderr.log`,
      exec_mode: 'fork',
    };
  }
}

export default new Pm2Lib();