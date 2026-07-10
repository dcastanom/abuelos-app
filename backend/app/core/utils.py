import re
import unicodedata
from datetime import date, datetime


def dates_to_datetimes(obj: object) -> object:
    """Recursively convert datetime.date → datetime.datetime so BSON can encode them."""
    if isinstance(obj, datetime):
        return obj
    if isinstance(obj, date):
        return datetime(obj.year, obj.month, obj.day)
    if isinstance(obj, dict):
        return {k: dates_to_datetimes(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [dates_to_datetimes(i) for i in obj]
    return obj


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[-\s]+", "-", text).strip("-")
