// pm2 process definitions for the Celeron deployment PC.
// Copy this file to the project root inside WSL2 (e.g. ~/abuelos-app/ecosystem.config.js)
// and run `pm2 start ecosystem.config.js` from that same directory.
//
// Both apps run as a single fork-mode instance (not cluster mode) since the
// target machine only has 2 threads total.

module.exports = {
  apps: [
    {
      name: "abuelos-backend",
      cwd: "./backend",
      script: "uv",
      args: "run uvicorn app.main:app --host 0.0.0.0 --port 8000",
      interpreter: "none",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      out_file: "../logs/backend.out.log",
      error_file: "../logs/backend.err.log",
    },
    {
      name: "abuelos-frontend",
      cwd: "./frontend",
      script: "pnpm",
      args: "start",
      interpreter: "none",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      env: {
        PORT: "3000",
      },
      out_file: "../logs/frontend.out.log",
      error_file: "../logs/frontend.err.log",
    },
  ],
};
