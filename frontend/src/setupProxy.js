const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://llama-lucky-mullet.ngrok-free.app',
      changeOrigin: true,
      secure: false,
    })
  );
}; 