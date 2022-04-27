import express from 'express';
import pm2Lib from './pm2Lib';
import socketIO from './socketIO';
import bodyParser from 'body-parser';
import * as child_process from 'child_process';

const app = express();

app.use(express.static('public', { dotfiles: 'allow' }));
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.redirect('/index.html');
});

app.get('/processes', async (req, res) => {
  res.json(await pm2Lib.getProcesses());
});

app.post('/github/push', async(req, res) => {
  const action = req.body.action
  const wasMerged = req.body.pull_request.merged
  const validPullRequestEvent = action == "closed" && wasMerged

  if (validPullRequestEvent) {
    console.log('New pull request merged to master. Pulling new changes...')
    child_process.exec("git pull", (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);   
    })
  }

  res.status(200).json(await pm2Lib.restartAllProcesses())
})

app.put('/processes/:filename/:action(start|restart|stop)', async (req, res) => {
  try {
    const { filename, action } = req.params;

    switch (action) {
      case 'start':
        res.json(await pm2Lib.startProcess(filename));
        break;
      case 'restart':
        res.json(await pm2Lib.restartProcess(filename));
        break;
      case 'stop':
        res.json(await pm2Lib.stopProcess(filename));
        break;
      default:
        return res.status(400).json({ message: `${action} is not supported!` });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    }
  }
});


const PORT = 80;

const httpServer = app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Server] Listening on :${PORT}`);
});

socketIO.init(httpServer);