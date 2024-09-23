async function build() {
  while (true) {
    const startTime = Date.now();
    const subprocess = Bun.spawn('bun build --target=bun index.ts --outfile index1.js'.split(' '), { stdout: 'inherit' });
    const timeout = setTimeout(() => {
      // console.log('Timeout');
      subprocess.kill();
    }, 500);
    const number = await subprocess.exited;
    console.log('Build time:', Date.now() - startTime, 'ms', 'Exit code:', number, subprocess.killed, subprocess.signalCode, subprocess.exitCode);
    if (number === 0) {
      break;
    }
  }
}

build();
