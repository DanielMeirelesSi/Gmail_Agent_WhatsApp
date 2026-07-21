function getEmailHeader(headers, name) {
  const header = headers.find(
    (item) => item.name.toLowerCase() === name.toLowerCase()
  );

  return header?.value || "";
}

function formatEmailList(emails) {
  return emails
    .map((email, index) => {
      return `
E-mail ${index + 1}
De: ${email.from}
Assunto: ${email.subject}
Data: ${email.date}
Trecho: ${email.snippet}
`;
    })
    .join("\n");
}

module.exports = {
  getEmailHeader,
  formatEmailList,
};