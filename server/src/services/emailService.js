import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendContactEmail = async ({ name, email, message }) => {
  await transporter.sendMail({
    from: `"VestWeb" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO,
    subject: "📩 Novo contato no VestWeb",
    text: `Novo contato recebido:\n\nNome: ${name}\nEmail: ${email}\nMensagem: ${message}`,
    html: `
      <h2>📩 Novo contato no VestWeb</h2>
      <table>
        <tr><td><strong>Nome:</strong></td><td>${name}</td></tr>
        <tr><td><strong>Email:</strong></td><td><a href="mailto:${email}">${email}</a></td></tr>
        <tr><td><strong>Mensagem:</strong></td><td>${message}</td></tr>
      </table>
    `,
  });
};
