#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMQTT = void 0;
var mqtt_1 = __importDefault(require("mqtt"));
var url_1 = require("url");
var timeInterval = null;
var startTime = null;
var getNetworkChange = function (action) {
    return "CONNECTION : ".concat(action);
};
var getTAndM = function (topic, message) {
    return "'".concat(message, "'@'").concat(topic, "'");
};
var getM = function (title, content) {
    return "".concat(title, " : ").concat(content);
};
var getActionStatus = function (service, status) {
    return "".concat(service, " ").concat(status);
};
var successMessage = function (message) {
    return console.log("\n\u001B[32m".concat(message, " \u001B[0m\n"));
};
var warningMessage = function (message) {
    return console.log("\u001B[33m".concat(message, "\u001B[0m"));
};
var infoMessage = function (message) {
    return console.log("\u001B[34m".concat(message, "\u001B[0m"));
};
var errorMessage = function (message) {
    return console.log("\u001B[31m".concat(message, "\u001B[0m"));
};
var sanitize = function (text) {
    if ((text.startsWith('"') && text.endsWith('"')) ||
        (text.startsWith("'") && text.endsWith("'"))) {
        return text.slice(1, text.length - 1).trim();
    }
    return text;
};
var exitProcess = function () {
    process.exit(0);
};
var subscribe = function (topic, RecieverClient) {
    topic = sanitize(topic);
    if (RecieverClient.connected) {
        if (topic) {
            RecieverClient.subscribe(topic, function (error) {
                if (error) {
                    errorMessage(getM(getActionStatus("SUBSCRIBED", "Error"), topic));
                }
                else {
                    infoMessage(getM(getActionStatus("SUBSCRIBED", "Success"), topic));
                }
            });
        }
        else {
            errorMessage(getM("TOPIC", "Invalid"));
        }
    }
    else {
        errorMessage(getM("CONNECTION", "Not Connected"));
    }
};
var publish = function (topic, message, RecieverClient) {
    topic = sanitize(topic);
    message = sanitize(message);
    if (RecieverClient.connected) {
        if (topic) {
            if (message) {
                RecieverClient.publish(topic, message, function (e) {
                    if (e) {
                        errorMessage(getM(getActionStatus("PUBLISHED", "Error"), getTAndM(topic, message)));
                    }
                    else {
                        infoMessage(getM(getActionStatus("PUBLISHED", "Success"), getTAndM(topic, message)));
                    }
                });
            }
            else {
                errorMessage(getM("MESSAGE", "Invalid"));
            }
        }
        else {
            errorMessage(getM("TOPIC", "Invalid"));
        }
    }
    else {
        errorMessage(getM("CONNECTION", "Not Connected"));
    }
};
var showConnectDuration = function (endTime) {
    if (endTime === void 0) { endTime = new Date().getTime(); }
    if (endTime && startTime) {
        infoMessage(getM("CONNECTION DURATION (s)", "".concat((endTime - startTime) / 1000)));
        startTime = null;
    }
    return;
};
var connectMQTT = function (brokerURL) {
    try {
        var url = new url_1.URL(brokerURL);
        console.log(url);
        var RecieverClient_1 = mqtt_1.default.connect(brokerURL, { keepalive: 0 });
        infoMessage(getM("\nNOTE", "Press e to exit anytime"));
        process.stdin.on("data", function (data) {
            var _a = data
                .toString()
                .trim()
                .match(/(?:[^\s"]+|"[^"]*")+/g) || [], _b = _a[0], basecmd = _b === void 0 ? "" : _b, _c = _a[1], topic = _c === void 0 ? "" : _c, _d = _a[2], message = _d === void 0 ? "" : _d;
            switch (basecmd) {
                case "sub":
                    return subscribe(topic, RecieverClient_1);
                case "pub":
                    return publish(topic, message, RecieverClient_1);
                case "e":
                    return exitProcess();
                default:
                    errorMessage(getM("COMMAND", "Unknown"));
            }
        });
        RecieverClient_1.on("connect", function () {
            successMessage(getNetworkChange("Connected"));
            startTime = new Date().getTime();
            console.log("Start writing commands: \nsub <TOPIC> : Subscribe a topic. \npub <TOPIC> <MESSAGE>: Publish a message to the topic\ne: Exit The Process\n");
            if (timeInterval) {
                clearInterval(timeInterval);
            }
            timeInterval = setInterval(function () {
                if (RecieverClient_1.connected) {
                    RecieverClient_1.publish("/ping_req_sys", "");
                }
                else {
                    if (timeInterval) {
                        clearInterval(timeInterval);
                    }
                }
            }, 3000);
        });
        RecieverClient_1.on("message", function (topic, message) {
            successMessage(getM("INCOMING MESSAGE", getTAndM(topic, message.toString())));
        });
        RecieverClient_1.on("reconnect", function () {
            infoMessage(getNetworkChange("Reconnect"));
        });
        RecieverClient_1.on("offline", function () {
            warningMessage(getNetworkChange("Offline"));
            showConnectDuration();
        });
        RecieverClient_1.on("closed", function () {
            warningMessage(getNetworkChange("Closed"));
            showConnectDuration();
        });
        RecieverClient_1.on("disconnect", function () {
            infoMessage(getNetworkChange("Disconnect"));
            showConnectDuration();
        });
        RecieverClient_1.on("error", function (error) {
            errorMessage(getNetworkChange("Error"));
            showConnectDuration();
        });
    }
    catch (error) {
        errorMessage(getM("BROKER URL", "Invalid"));
    }
};
exports.connectMQTT = connectMQTT;
(0, exports.connectMQTT)(process.argv[2]);
//# sourceMappingURL=index.js.map