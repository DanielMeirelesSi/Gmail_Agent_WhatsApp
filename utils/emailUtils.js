function getEmailHeader(headers, name) {
  const header = headers.find(
    (item) => item.name.toLowerCase() === name.toLowerCase()
  );

  return header?.value || "";
}

function maskEmailAddress(email) {
  if (!email || !email.includes("@")) {
    return email;
  }

  const [user, domain] = email.split("@");

  if (!user || !domain) {
    return email;
  }

  const visibleStart = user.slice(0, 2);
  const visibleEnd = user.length > 4 ? user.slice(-1) : "";

  return `${visibleStart}***${visibleEnd}@${domain}`;
}

function maskEmailsInText(text) {
  if (!text) {
    return "";
  }

  return text.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    (email) => maskEmailAddress(email)
  );
}

function cleanEmailText(text) {
  if (!text) {
    return "";
  }

  return maskEmailsInText(text)
    .replace(/\s+/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

function formatEmailList(emails) {
  return emails
    .map((email, index) => {
      return `
E-mail ${index + 1}
De: ${cleanEmailText(email.from)}
Assunto: ${cleanEmailText(email.subject)}
Data: ${cleanEmailText(email.date)}
Trecho: ${cleanEmailText(email.snippet)}
`;
    })
    .join("\n");
}

module.exports = {
  getEmailHeader,
  maskEmailAddress,
  maskEmailsInText,
  cleanEmailText,
  formatEmailList,
};