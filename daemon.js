/* 
 * Copyright 2017 Szymon.
 *
 * Licensed under the inOneCar.com license, Version 1.0 (the "License");
 */

'use strict';
var daemon = require("daemonize2").setup({
    main: "server.js",
    name: "server",
    pidfile: "server.pid",
    //user: "www",
    //group: "www",
    //silent: true
    cwd: "/users/developer/dev.otodojazd.pl/aws"
});

if (process.getuid() !== 0) {
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
    .on("stopped", function(pid) {
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

    case "reload":
        console.log("Reload.");
        daemon.sendSignal("SIGUSR1");
        break;

    case "status":
        var pid = daemon.status();
        if (pid)
            console.log("Daemon running. PID: " + pid);
        else
            console.log("Daemon is not running.");
        break;
    
    default:
        console.log("Usage: [start|stop|kill|restart|reload|status]");
}