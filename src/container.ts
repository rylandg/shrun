import { join } from 'path';
import { spawn } from 'child_process';
import Docker from 'dockerode';
import { v4 as uuidv4 } from 'uuid';
import { PassThrough as PassThroughStream } from 'stream';

import { msleep } from './msleep';

const docker = new Docker();

// interval(in ms) to check whether the current command
// has finished running
const msCmdPollInterval = 50;
const startCommand = 'bash';

const runCmd = (cmd: string, args: string[]) => {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args);
    let wasErr = false;
    let stderrEnd = false;
    let stdoutEnd = false;
    const shouldResolve = () => {
      if (stdoutEnd && stderrEnd) {
        wasErr ? reject() : resolve();
      }
    };
    child.stdout.on('data', (buffer) => {
      process.stdout.write(buffer.toString());
    });
    child.stdout.on('end', () => {
      stdoutEnd = true;
      shouldResolve();
    });
    child.stderr.on('data', (buffer) => {
      process.stderr.write(buffer.toString());
      wasErr = true;
    });
    child.stderr.on('end', () => {
      stderrEnd = true;
      shouldResolve();
    });
  })
}

export const buildImage = async (commandName?: string) => {
  const dockerFile = join(
    process.cwd(),
    'node_modules',
    'shrun',
    'docker_files',
    'Dockerfile'
  );
  const cmd = 'docker';
  const userSpecifier = commandName || 'usercli';
  const args = [
    'build',
    '.',
    '-f',
    dockerFile,
    '--tag',
    `${userSpecifier}:latest`,
  ];

  if (commandName) {
    args.push('--build-arg');
    args.push(`CLICOMMAND_ARG=${commandName}`);
  }
  await runCmd(cmd, args);
};

export class Container {
  public started = false;
  private outDialog: string[] = [];
  private errDialog: string[] = [];
  private outStream: PassThroughStream = new PassThroughStream();
  private errStream: PassThroughStream = new PassThroughStream();
  private dockerStream: NodeJS.ReadWriteStream | undefined = undefined;
  private container: Docker.Container | undefined = undefined;
  private cmdUUID: string | undefined = undefined;
  private exitCode: string | number = 0;

  /**
   * Creates a container handle with the specified Docker image.
   */
  constructor(private imageName: string) {}

  /**
   * Starts a container based on the image name provided
   * when this instance was intialized. The container
   * must be removed before exiting your application or it
   * will be left dangling.
   */
  async startContainer(envVars?: string[]) {
    this.container = await docker.createContainer({
      Image: this.imageName,
      Cmd: [startCommand],
      Env: envVars,
      Tty: false, // allocating the TTY completes messes up docker headers
      OpenStdin: true,
      StdinOnce: false,
    });

    // handle all stdout from the readside of the HTTPDuplex
    this.outStream.on('data', chunk => {
      const rawPayload = chunk.toString();
      if (rawPayload !== '') {
        // every stdout line received is checked to see if
        // it could signal an end of command sequence. The
        // sequence is uniquely generated for each command.
        // 1 is added to the length for the minimum 1 exit
        // char, an addtional 1 is added for the newline
        if (this.cmdUUID && rawPayload.length >= this.cmdUUID.length * 2 + 2) {
          const possibleUUID = rawPayload.slice(-9, -1);
          if (possibleUUID === this.cmdUUID) {
            // the UUID is only 8 characters, the rest is
            // the exit code
            const exitParts = rawPayload.split(this.cmdUUID);
            // handle the case of stdout buffering
            if (exitParts[0] !== '') {
              this.outDialog.push(exitParts[0]);
            }
            // -2 is for the guaranteed newline after the UUIDS
            this.exitCode = exitParts[exitParts.length - 2];
            this.cmdUUID = undefined;
          }
        }
        if (this.cmdUUID !== undefined) {
          this.outDialog.push(rawPayload);
        }
      }
    });
    // handle all stderr from the readside of the HTTPDuplex
    this.errStream.on('data', chunk => {
      if (chunk.toString() !== '') {
        this.errDialog.push(chunk.toString());
      }
    });

    // attach to the newly created container w/ all stdio
    this.dockerStream = await this.container.attach({
      stream: true,
      stdin: true,
      stdout: true,
      stderr: true,
    });

    // handle the case of the bash process itself crashing
    this.dockerStream.on('end', () => {
      this.cmdUUID = undefined;
      this.exitCode = 1;
      this.started = false;
    });
    // separates out stderr/stdout, this can also be done manually with the headers
    this.container.modem.demuxStream(
      this.dockerStream,
      this.outStream,
      this.errStream,
    );
    // start the container and wait for the startup command to finish
    await this.container.start();
    this.started = true;
  }

  /**
   * Streams a series of inputlines to the shell of
   * this Docker container. The lines are required to
   * generate a single bash exit code. The only real case
   * where it makes sense to send more than 1 at once is
   * for interacting with stdin.
   */
  async streamIn(inputLine: string) {
    if (!this.started || !this.dockerStream) {
      throw new Error('Container must be started before streaming into it');
    }
    // unqiue sequence that until received by stdout
    // will cause this function to be block
    this.cmdUUID = uuidv4().slice(0, 8);
    this.dockerStream.write(`${inputLine}\n`);
    // grabs exit code of last command executed in the shell
    // the UUID ensures that we don't misinterpret it
    this.dockerStream.write(`echo ${this.cmdUUID}$?${this.cmdUUID}\n`);
    // Because some commands have no stdio it's safer
    // to wait for the exit code to be printed.
    while (this.cmdUUID !== undefined) {
      // eslint-disable-next-line no-await-in-loop
      await msleep(msCmdPollInterval);
    }
    return this.flushOutput();
  }

  /**
   * Flushes all of the collected output(stderr/stdout).
   * To receive a non-empty array, actions must have been
   * previously streamed to the container using 'streamIn'
   */
  flushOutput() {
    const output = {
      // array spread allows for a fast and efficient deep copy
      // join all output lines with \n
      stdout: [...this.outDialog].join(''),
      stderr: [...this.errDialog].join(''),
      exitCode: parseInt(this.exitCode.toString(), 10),
    };
    // flush
    this.errDialog.length = 0;
    this.outDialog.length = 0;
    return output;
  }

  /**
   * Attempts to stop and then kill this container.
   */
  async stopAndKillContainer() {
    if (this.container && this.started) {
      await this.container.stop();
      await this.container.remove();
      this.started = false;
    }
  }
}
