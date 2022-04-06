(function ($, window, document) {
    $(async function () {
      const socket = io();
  
      function getStatusBadge(status) {
        switch (status) {
          case "stopped":
            return `<span class="badge badge-danger">${status}</span>`;
          case "online":
            return `<span class="badge badge-success">${status}</span>`;
          default:
            return `<span class="badge badge-default">${status}</span>`;
        }
      }
  
      function getActionButton(status) {
        if (status === "online") {
          return `
            <button type="button" class="btn btn-outline-danger" data-action="stop" title="stop">
              <i class="bi bi-pause-circle"></i>
            </button>
            <button type="button" class="btn btn-outline-warning" data-action="tail-log" title="show log">
              <i class="bi bi-terminal"></i>
            </button>
        `;
        }
        return `
            <button type="button" class="btn btn-outline-primary" data-action="start" title="start">
              <i class="bi bi-play-circle"></i>
            </button>
        `;
      }
  
      async function updateProcessesStatus() {
        const response = await fetch('/processes');
        const processes = await response.json();
  
        const trs = [];
        for (const process of processes) {
          trs.push(`
            <tr id="${process.name}">
                  <td>${process.name}</td>
                  <td>${getStatusBadge(process.pm2_env.status)}</td>
                  <td>
                      <div class="btn-group">
                          <button type="button" class="btn btn-default btn-sm">
                            CPU: ${process.monit ? process.monit.cpu : 'N/A'}
                          </button>
                          <button type="button" class="btn btn-default btn-sm">
                            RAM: ${process.monit ? (process.monit.memory / (1024 * 1024)).toFixed(1) + ' MB' : 'N/A'}
                          </button>
                        </div>
                  </td>
                  <td>
                      ${getActionButton(process.pm2_env.status)}
                      <button type="button" class="btn btn-outline-success" data-action="restart" title="restart">
                        <i class="bi bi-arrow-repeat"></i>
                      </button>
                  </td>
              </tr>
          `);
        }
  
        $('#tbl-processes tbody').html(trs.join(''));
      }
  
      function showStdLog(process) {
        const $console = $('#console');
        $console.empty();
        socket.removeAllListeners();

        let log = ""
  
        socket.on(`${process}:out_log`, (procLog) => {
          log += procLog.data + "\n";
          $console.text(log); 
          $console.scrollTop($console[0].scrollHeight - $console[0].clientHeight)
        });
      }
  
      updateProcessesStatus();
  
      setInterval(() => {
        updateProcessesStatus();
      }, 15 * 1000);
  
      $(document).on('click', 'button', async function () {
        const self = $(this);
        const action = self.data('action');
        const process = self.parents('tr').attr('id');
  
        if (!action) {
          return;
        }
  
        if (action && process && ['start', 'stop', 'restart'].indexOf(action) >= 0) {
          try {
            const response = await fetch(`/processes/${process}/${action}`, { method: 'PUT' });
            const data = await response.json();
            if (response.status !== 200) {
              throw new Error(data.message);
            }
            updateProcessesStatus();
          } catch (error) {
            alert(error.message);
          }
        }
  
        if (action === 'tail-log') {
          showStdLog(process);
        }
      });
    });
  }(window.jQuery, window, document));