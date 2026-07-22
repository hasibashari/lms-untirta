import { Resend } from 'resend';
import logger from '../config/logger.js';

const resendApiKey = process.env.RESEND_API || process.env.RESEND_API_KEY;
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Service pengiriman email reset password.
 * 1. Menggunakan Resend API jika RESEND_API / RESEND_API_KEY terkonfigurasi.
 * 2. Fallback ke Logger untuk mode development lokal.
 */
export const sendResetPasswordEmail = async (toEmail, resetToken) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #0056b3;">Reset Password LMS Untirta</h2>
      <p>Halo,</p>
      <p>Kami menerima permintaan untuk mereset password akun Anda di LMS Untirta.</p>
      <p>Silakan klik tombol di bawah ini untuk membuat password baru Anda. Tautan ini berlaku selama <strong>15 menit</strong>:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #0056b3; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password Saya</a>
      </div>
      <p style="font-size: 12px; color: #777;">Jika tombol di atas tidak berfungsi, salin dan tempel tautan berikut ke browser Anda:</p>
      <p style="font-size: 12px; word-break: break-all; color: #0056b3;"><a href="${resetLink}">${resetLink}</a></p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888;">Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini. Password Anda akan tetap aman.</p>
    </div>
  `;

  // 1. Kirim via Resend API
  if (resendClient) {
    try {
      const fromEmail = process.env.RESEND_FROM || 'LMS Untirta <onboarding@resend.dev>';
      const data = await resendClient.emails.send({
        from: fromEmail,
        to: [toEmail],
        subject: 'Instruksi Reset Password - LMS Untirta',
        html: htmlContent,
      });

      logger.info({ toEmail, resendId: data.data?.id || data.id }, '[EMAIL SERVICE] Email reset password berhasil dikirim via Resend API');
      return true;
    } catch (error) {
      logger.error({ error, toEmail }, '[EMAIL SERVICE] Gagal mengirim email via Resend API');
    }
  }

  // 2. Fallback ke Logger jika Resend API key belum dikonfigurasi
  logger.info({ toEmail, resetLink }, '[EMAIL SERVICE - DEV MODE] Instructions to reset password sent (No active email provider)');
  return true;
};
