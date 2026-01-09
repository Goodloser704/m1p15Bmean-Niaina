const { createApp } = require("./app");
const { connectToDb } = require("./config/db");
const { port, mongodbUri } = require("./config/env");

async function main() {
  await connectToDb(mongodbUri);
  const app = createApp();
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

