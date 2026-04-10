import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Email 1: confirmação de endereço (enviado ao salvar PendingStudent)
export async function sendVerificationEmail({ to, name, token }) {
  const serverUrl = process.env.SERVER_URL || 'http://localhost:3001';
  const link = `${serverUrl}/api/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"VestWeb" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Confirme seu e-mail — VestWeb',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto">
        <h2 style="color:#4f46e5">Olá, ${name}!</h2>
        <p>Você iniciou sua assinatura na VestWeb. Confirme seu e-mail clicando no botão abaixo:</p>
        <a href="${link}"
           style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;
                  border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
          Confirmar e-mail
        </a>
        <p style="color:#6b7280;font-size:13px">
          O link é válido por 24 horas. Se não foi você, ignore este e-mail.
        </p>
      </div>
    `,
  });
}

// Email 2: boas-vindas com matrícula (enviado após pagamento confirmado)
export async function sendEnrollmentEmail({ to, name, enrollment, planTier }) {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  await transporter.sendMail({
    from: `"VestWeb" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Sua matrícula VestWeb está pronta! 🎉',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto">
        <h2 style="color:#4f46e5">Bem-vindo(a) à VestWeb, ${name}!</h2>
        <p>Seu pagamento foi confirmado. Aqui estão suas informações de acesso:</p>

        <div style="background:#f5f3ff;border-radius:8px;padding:16px 24px;margin:16px 0">
          <p style="margin:0;font-size:13px;color:#6b7280">Plano</p>
          <p style="margin:4px 0 12px;font-weight:600">VestWeb ${planTier}</p>
          <p style="margin:0;font-size:13px;color:#6b7280">Matrícula</p>
          <p style="margin:4px 0 0;font-size:22px;font-weight:700;letter-spacing:2px;color:#4f46e5">
            ${enrollment}
          </p>
        </div>

        <p>Use seu e-mail e a senha que você cadastrou para entrar na plataforma.</p>
        <a href="${clientUrl}/login"
           style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;
                  border-radius:8px;text-decoration:none;font-weight:600;margin:8px 0">
          Acessar plataforma
        </a>
        <p style="color:#6b7280;font-size:13px">
          Guarde sua matrícula — ela é usada para identificar sua conta.
        </p>
      </div>
    `,
  });
}

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
