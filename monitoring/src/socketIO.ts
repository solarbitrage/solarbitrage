import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import pm2Lib, { IProcessOutLog } from "./pm2Lib";

class SocketIO {
  private io: Server | undefined;

  init(httpServer: HttpServer) {
    if (this.io !== undefined) {
      throw new Error('Socket server already defined!');
    }

    this.io = new Server(httpServer);

    pm2Lib.onLogOut((procLog: IProcessOutLog) => {
      this.io?.emit(`${procLog.process.name}:out_log`, procLog);
    });
  }
}

export default new SocketIO();