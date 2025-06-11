function sendEmail(to, subject, body) {
  // Simulate sending an email
  console.log(`Sending email to: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${body}`);
  sendEmail.send({
    to: to,
    subject: subject,
    body: body
  }).then(
    message => alert(`Email sent to ${to} with subject "${subject}"`),
  );
}