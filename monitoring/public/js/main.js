$(async function () {
  const term = new Terminal({convertEol: true});
  const fitAddon = new FitAddon.FitAddon();
  term.loadAddon(fitAddon);
  term.open(document.getElementById("terminal"));
  fitAddon.fit();
  setInterval(() => fitAddon.fit(), 200);

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
            <button type="button" class="btn btn-sm mb-2 btn-outline-danger" data-action="stop" title="stop">
              <i class="bi bi-pause-circle"></i>
            </button>
            <button type="button" class="btn btn-sm mb-2 btn-outline-warning" data-action="tail-log" title="show log">
              <i class="bi bi-terminal"></i>
            </button>
        `;
    }
    return `
            <button type="button" class="btn btn-sm mb-2 btn-outline-primary" data-action="start" title="start">
              <i class="bi bi-play-circle"></i>
            </button>
        `;
  }

  async function updateProcessesStatus() {
    const response = await fetch("/processes");
    const processes = await response.json();

    const trs = [];
    for (const process of processes) {
      trs.push(`
            <tr id="${process.name}">
                  <td>${process.name}</td>
                  <td>${getStatusBadge(process.pm2_env.status)}</td>
                  <td>
                      <div class="btn-group">
                          <button type="button" class="btn btn-sm mb-2 btn-default btn-sm">
                            CPU: ${process.monit ? process.monit.cpu : "N/A"}
                          </button>
                          <button type="button" class="btn btn-sm mb-2 btn-default btn-sm">
                            RAM: ${
                              process.monit
                                ? (
                                    process.monit.memory /
                                    (1024 * 1024)
                                  ).toFixed(1) + " MB"
                                : "N/A"
                            }
                          </button>
                        </div>
                  </td>
                  <td>
                      ${getActionButton(process.pm2_env.status)}
                      <button type="button" class="btn btn-sm mb-2 btn-outline-success" data-action="restart" title="restart">
                        <i class="bi bi-arrow-repeat"></i>
                      </button>
                  </td>
              </tr>
          `);
    }

    $("#tbl-processes tbody").html(trs.join(""));
  }

  async function restartAllProcesses() {
    const response = await fetch("/processes");
    const processes = await response.json();

    for (const process of processes) {
      const response = await fetch(`/processes/${process.name}/restart`, {
        method: "PUT",
      });

      const data = await response.json();

      if (response.status !== 200) {
        throw new Error(data.message);
      }
    }

    updateProcessesStatus();
  }
  function showStdLog(process) {
    term.clear();
    term.write(`Tailing logs for ${process}...\n`);
    let buf = ""

    const listener = (procLog) => {
      buf += procLog.data;
    }

    socket.on(`${process}:out_log`, listener);
    
    let shouldStop = false;

    const loop = () => {
      term.write(buf, () => {
        buf = "";
        if (!shouldStop) {
          setTimeout(loop, 100);
        }
      });
    }
    loop();

    return () => {
      shouldStop = true;
      socket.removeListener(`${process}:out_log`, listener);
    }

  }

  updateProcessesStatus();

  setInterval(() => {
    updateProcessesStatus();
  }, 15 * 1000);


  let stopFunc;

  $(document).on("click", "button", async function () {
    const self = $(this);
    const action = self.data("action");
    const process = self.parents("tr").attr("id");

    if (!action) {
      return;
    }

    if (
      action &&
      process &&
      ["start", "stop", "restart"].indexOf(action) >= 0
    ) {
      try {
        const response = await fetch(`/processes/${process}/${action}`, {
          method: "PUT",
        });
        const data = await response.json();
        if (response.status !== 200) {
          throw new Error(data.message);
        }
        updateProcessesStatus();
      } catch (error) {
        alert(error.message);
      }
    }

    if (action === "tail-log") {
      if (stopFunc) {
        stopFunc();
      }
      stopFunc = showStdLog(process);
    } else if (action === "stop-tail") {
      stopFunc();
    } else if (action === "restart-all") {
      restartAllProcesses();
    }
  });
});
