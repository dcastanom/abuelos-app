from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

import aiosmtplib
from jinja2 import Environment, FileSystemLoader

from app.core.config import settings

_templates_dir = Path(__file__).parent.parent / "templates"
_jinja = Environment(loader=FileSystemLoader(str(_templates_dir)), autoescape=True)


async def _send_email(to_email: str, subject: str, html_body: str) -> None:
    if not settings.SMTP_HOST:
        print(f"[email] {subject} → {to_email}")
        return

    message = MIMEMultipart("alternative")
    message["From"] = settings.SMTP_USER
    message["To"] = to_email
    message["Subject"] = subject
    message.attach(MIMEText(html_body, "html", "utf-8"))

    await aiosmtplib.send(
        message,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
        start_tls=True,
    )


async def send_confirmation_email(to_email: str, company_name: str, token: str) -> None:
    confirmation_url = f"{settings.FRONTEND_URL}/confirm/{token}"
    html = _jinja.get_template("confirm_email.html").render(
        company_name=company_name,
        confirmation_url=confirmation_url,
    )
    await _send_email(to_email, f"Confirmar registro — {company_name}", html)
