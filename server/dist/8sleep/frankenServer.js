import { SequentialQueue } from './sequentialQueue.js';
import { MessageStream } from './messageStream.js';
import { PromiseStreams } from './promiseStream.js';
import { frankenCommands } from './deviceApi.js';
import { UnixSocketServer } from './unixSocketServer.js';
import logger from '../logger.js';
import { loadDeviceStatus } from './loadDeviceStatus.js';
import { wait } from './promises.js';
// This must be hard coded, this was the original dac.sock path
const SOCKET_PATH = process.platform === 'darwin' ? '/Users/ds/free-sleep/tmp/dac.sock' : '/deviceinfo/dac.sock';
export class Franken {
    constructor(writeStream, messageStream, sequentialQueue, socket) {
        this.writeStream = writeStream;
        this.messageStream = messageStream;
        this.sequentialQueue = sequentialQueue;
        this.socket = socket;
    }
    async sendMessage(message) {
        logger.debug(`Sending message to sock | message: ${message}`);
        const responseBytes = await this.sequentialQueue.exec(async () => {
            const requestBytes = Buffer.concat([Buffer.from(message), Franken.separator]);
            await this.writeStream.write(requestBytes);
            const resp = await this.messageStream.readMessage();
            await wait(50);
            return resp;
        });
        const response = responseBytes.toString();
        logger.debug(`Message sent successfully to sock | message: ${message}`);
        return response;
    }
    tryStripNewlines(arg) {
        const containsNewline = arg.indexOf('\n') >= 0;
        if (!containsNewline)
            return arg;
        return arg.replace(/\n/gm, '');
    }
    async callFunction(command, arg) {
        logger.debug(`Calling function | command: ${command} | arg: ${arg}`);
        const commandNumber = frankenCommands[command];
        const cleanedArg = this.tryStripNewlines(arg);
        logger.debug(`commandNumber: ${commandNumber}`);
        logger.debug(`cleanedArg: ${cleanedArg}`);
        await this.sendMessage(`${commandNumber}\n${cleanedArg}`);
    }
    async getDeviceStatus() {
        const command = 'DEVICE_STATUS';
        const commandNumber = frankenCommands[command];
        const response = await this.sendMessage(commandNumber);
        return loadDeviceStatus(response);
    }
    close() {
        const socket = this.socket;
        if (!socket.destroyed)
            socket.destroy();
    }
    static fromSocket(socket) {
        // @ts-expect-error - Mismatched types
        const stream = PromiseStreams.toPromise(socket);
        const messageStream = new MessageStream(stream, Franken.separator);
        return new Franken(stream, messageStream, new SequentialQueue(), socket);
    }
}
Franken.separator = Buffer.from('\n\n');
class FrankenServer {
    constructor(server) {
        this.server = server;
    }
    async close() {
        logger.debug('Closing FrankenServer socket...');
        await this.server.close();
    }
    async waitForFranken() {
        const socket = await this.server.waitForConnection();
        logger.debug('FrankenServer connected');
        return Franken.fromSocket(socket);
    }
    static async start(path) {
        logger.debug(`Creating franken server on socket: ${SOCKET_PATH}`);
        const unixSocketServer = await UnixSocketServer.start(path);
        return new FrankenServer(unixSocketServer);
    }
}
let frankenServer;
export async function getFrankenServer() {
    // If we've already started it, reuse:
    if (frankenServer)
        return frankenServer;
    // Otherwise, start a new instance once:
    frankenServer = await FrankenServer.start(SOCKET_PATH);
    logger.debug('FrankenServer started');
    return frankenServer;
}
let franken;
export async function getFranken() {
    if (franken)
        return franken;
    const frankenServer = await getFrankenServer();
    franken = await frankenServer.waitForFranken();
    return franken;
}
