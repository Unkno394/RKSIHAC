import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger(__name__)

def send_confirmation_code(email: str, code: str):
    """Отправка письма с кодом подтверждения"""
    subject = "Подтверждение регистрации"
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #020616; color: #fff; padding: 20px;">
      <table role="presentation" style="width: 100%; background-color: #020616; color: #fff;">
        <tr>
          <td style="padding-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 5px;">
              <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(90deg, #3b82f6, #9333ea);"></div>
              <span style="font-size: 24px; font-weight: bold; color: #fff; line-height: 50px; margin-left: 5px;">Афиша+</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background-color: #1a202c; padding: 20px; border-radius: 8px;">
            <h2 style="font-size: 22px; margin-bottom: 10px; color: #fff;">Здравствуйте!</h2>
            <p style="font-size: 16px; color: #b0b0b0;">Для завершения регистрации на сайте Афиша+, используйте следующий код:</p>
            <h3 style="font-size: 28px; font-weight: bold; color: #fff;">{code}</h3>
            <p style="font-size: 16px; color: #b0b0b0;">Код действует в течение 24 часов. Не передавайте этот код третьим лицам!</p>
            <p style="font-size: 16px; margin-top: 20px; color: #b0b0b0;">С наилучшими пожеланиями,<br> Команда Афиша+</p>
          </td>
        </tr>
        <tr>
          <td style="padding-top: 20px;">
            <p style="font-size: 12px; color: #b0b0b0;">Если у вас возникли вопросы, не стесняйтесь обращаться в нашу службу поддержки.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """
    send_email(email, subject, body)


def send_reset_code(email: str, code: str):
    """Отправка письма с кодом для сброса пароля"""
    subject = "Сброс пароля"
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #020616; color: #fff; padding: 20px;">
      <table role="presentation" style="width: 100%; background-color: #020616; color: #fff;">
        <tr>
          <td style="padding-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 5px;">
              <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(90deg, #3b82f6, #9333ea);"></div>
              <span style="font-size: 24px; font-weight: bold; color: #fff; line-height: 50px; margin-left: 5px;">Афиша+</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background-color: #1a202c; padding: 20px; border-radius: 8px;">
            <h2 style="font-size: 22px; margin-bottom: 10px; color: #fff;">Здравствуйте!</h2>
            <p style="font-size: 16px; color: #b0b0b0;">Для сброса пароля на сайте Афиша+, используйте следующий код:</p>
            <h3 style="font-size: 28px; font-weight: bold; color: #fff;">{code}</h3>
            <p style="font-size: 16px; color: #b0b0b0;">Код действует в течение 24 часов. Не передавайте этот код третьим лицам!</p>
            <p style="font-size: 16px; margin-top: 20px; color: #b0b0b0;">С наилучшими пожеланиями,<br> Команда Афиша+</p>
          </td>
        </tr>
        <tr>
          <td style="padding-top: 20px;">
            <p style="font-size: 12px; color: #b0b0b0;">Если у вас возникли вопросы, не стесняйтесь обращаться в нашу службу поддержки.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """
    send_email(email, subject, body)


def send_welcome_email(email: str, full_name: str):
    """Отправка письма с приветствием после подтверждения почты"""
    subject = "Добро пожаловать!"
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #020616; color: #fff; padding: 20px;">
      <table role="presentation" style="width: 100%; background-color: #020616; color: #fff;">
        <tr>
          <td style="padding-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 5px;">
              <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(90deg, #3b82f6, #9333ea);"></div>
              <span style="font-size: 24px; font-weight: bold; color: #fff; line-height: 50px; margin-left: 5px;">Афиша+</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background-color: #1a202c; padding: 20px; border-radius: 8px;">
            <h2 style="font-size: 22px; margin-bottom: 10px; color: #fff;">Здравствуйте, {full_name}!</h2>
            <p style="font-size: 16px; color: #b0b0b0;">Вы успешно подтвердили почту и зарегистрировались на Афиша+.</p>
            <p style="font-size: 16px; color: #b0b0b0;">Добро пожаловать!</p>
          </td>
        </tr>
        <tr>
          <td style="padding-top: 20px;">
            <p style="font-size: 12px; color: #b0b0b0;">Если у вас возникли вопросы, напишите в поддержку.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """
    send_email(email, subject, body)


def send_password_changed(email: str):
    """Отправка уведомления об успешной смене пароля"""
    subject = "Пароль изменён"
    body = """
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #020616; color: #fff; padding: 20px;">
      <table role="presentation" style="width: 100%; background-color: #020616; color: #fff;">
        <tr>
          <td style="background-color: #1a202c; padding: 20px; border-radius: 8px;">
            <h2 style="font-size: 22px; margin-bottom: 10px; color: #fff;">Ваш пароль изменён</h2>
            <p style="font-size: 16px; color: #b0b0b0;">Если это были не вы — срочно смените пароль и свяжитесь с поддержкой.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """
    send_email(email, subject, body)

def send_email(to_email: str, subject: str, body: str):
    """Отправка письма"""
    from_email = settings.EMAIL_FROM
    smtp_host = settings.SMTP_HOST
    smtp_port = settings.SMTP_PORT
    smtp_user = settings.SMTP_USER
    smtp_password = settings.SMTP_PASSWORD
    use_tls = settings.SMTP_USE_TLS

    # Создаём объект сообщения
    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'html'))

    if not smtp_user or not smtp_password:
        logger.error("[EMAIL ERROR] SMTP_USER/SMTP_PASSWORD не заданы")
        return

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.ehlo()
            if use_tls:
                server.starttls()
                server.ehlo()
            server.login(smtp_user, smtp_password)
            server.sendmail(from_email, to_email, msg.as_string())
        logger.info("[EMAIL] Письмо отправлено на %s", to_email)
    except Exception as e:
        logger.exception("[EMAIL ERROR] Не удалось отправить письмо на %s", to_email)
