import html
import os
import smtplib
from email.message import EmailMessage
from urllib.parse import urlencode


def _send_email(recipient, subject, text_body, html_body):
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = os.environ["EMAIL_FROM"]
    message["To"] = recipient
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")

    host = os.environ["SMTP_HOST"]
    port = int(os.getenv("SMTP_PORT", "1025"))
    with smtplib.SMTP(host, port, timeout=10) as smtp:
        if os.getenv("SMTP_USE_TLS", "false").lower() == "true":
            smtp.starttls()
        username = os.getenv("SMTP_USER")
        password = os.getenv("SMTP_PASSWORD")
        if username and password:
            smtp.login(username, password)
        smtp.send_message(message)


def send_reset_email(recipient, raw_token):
    reset_url = f"{os.environ['FRONTEND_URL'].rstrip('/')}/reset-password?{urlencode({'token': raw_token})}"
    safe_url = html.escape(reset_url, quote=True)
    _send_email(
        recipient,
        "Reset your Project Gym password",
        f"Use this link to reset your password. It expires in 30 minutes:\n\n{reset_url}\n\nIf you did not request this, you can ignore this email.",
        f"<html><body><h1>Reset your password</h1><p>This link expires in 30 minutes.</p><p><a href=\"{safe_url}\">Reset password</a></p><p>If you did not request this, you can ignore this email.</p></body></html>",
    )


def send_password_changed_email(recipient):
    _send_email(
        recipient,
        "Your Project Gym password was changed",
        "Your password was changed successfully. If you did not make this change, contact your gym administrator.",
        "<html><body><h1>Password changed</h1><p>Your password was changed successfully.</p><p>If you did not make this change, contact your gym administrator.</p></body></html>",
    )
