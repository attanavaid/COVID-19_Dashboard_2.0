export default {
  root: "./src",
  publicDir: "public",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: "./src/index.html",
        news: "./src/news.html",
        settings: "./src/settings.html",
        about: "./src/about.html",
        help: "./src/help.html",
        terms: "./src/terms.html",
        policy: "./src/policy.html",
      },
    },
  },
};