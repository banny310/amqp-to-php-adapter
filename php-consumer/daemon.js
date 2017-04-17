/**
 * Created by sbanas on 15.04.2017.
 */
'use strict';

//noinspection JSUnresolvedVariable
const daemon = require("daemonize2")
    .setup({
        main: "index.js",
        name: "server",
        pidfile: "server.pid",
        silent: false
    });

if (process.getuid && process.getuid() !== 0) {
    console.log("Expected to run as root");
    process.exit(1);
}

daemon
    .on("starting", function() {
        console.log("Starting daemon...");
    })
    .on("started", function(pid) {
        console.log("Daemon started. PID: " + pid);
    })
    .on("stopping", function() {
        console.log("Stopping daemon...");
    })
    .on("stopped", function() {
        console.log("Daemon stopped.");
    })
    .on("running", function(pid) {
        console.log("Daemon already running. PID: " + pid);
    })
    .on("notrunning", function() {
        console.log("Daemon is not running");
    })
    .on("error", function(err) {
        console.log("Daemon failed to start:  " + err.message);
    });


switch (process.argv[2]) {
    case "start":
        daemon.start().once("started", function() {
            process.exit();
        });
        break;
    
    case "stop":
        daemon.stop();
        break;
    
    case "kill":
        daemon.kill();
        break;
    
    case "restart":
        if (daemon.status()) {
            daemon.stop().once("stopped", function() {
                daemon.start().once("started", function() {
                    process.exit();
                });
            });
        } else {
            daemon.start().once("started", function() {
                process.exit();
            });
        }
        break;

    case "status":
        const pid = daemon.status();
        if (pid)
            console.log("Daemon running. PID: " + pid);
        else
            console.log("Daemon is not running.");
        break;
    
    default:
        console.log("Usage: [start|stop|kill|restart|status]");
}