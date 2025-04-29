module.exports = {
    apps: [{
      name: "topology-web",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      }
    }]
  }