const path = require("path");
const fs = require("fs");

function getDataDir() {
  return process.env.DATA_DIR || ".";
}

function ensureDataDirExists() {
  const dataDir = getDataDir();

  if (dataDir !== "." && !fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function getStoragePath(fileName) {
  ensureDataDirExists();

  return path.join(getDataDir(), fileName);
}

module.exports = {
  getStoragePath,
};