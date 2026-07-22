const fs = require("fs");

const EMAIL_STATE_PATH = "email-state.json";

function getDefaultState() {
  return {
    seenEmailIds: [],
    lastCheckedAt: null,
  };
}

function loadEmailState() {
  if (!fs.existsSync(EMAIL_STATE_PATH)) {
    return getDefaultState();
  }

  try {
    const content = fs.readFileSync(EMAIL_STATE_PATH, "utf8");
    return JSON.parse(content);
  } catch {
    return getDefaultState();
  }
}

function saveEmailState(state) {
  fs.writeFileSync(EMAIL_STATE_PATH, JSON.stringify(state, null, 2));
}

function getNewEmails(emails) {
  const state = loadEmailState();
  const seenIds = new Set(state.seenEmailIds || []);

  return emails.filter((email) => !seenIds.has(email.id));
}

function markEmailsAsSeen(emails) {
  const state = loadEmailState();
  const currentIds = new Set(state.seenEmailIds || []);

  for (const email of emails) {
    if (email.id) {
      currentIds.add(email.id);
    }
  }

  const updatedIds = Array.from(currentIds).slice(-300);

  saveEmailState({
    seenEmailIds: updatedIds,
    lastCheckedAt: new Date().toISOString(),
  });
}

module.exports = {
  getNewEmails,
  markEmailsAsSeen,
  loadEmailState,
};