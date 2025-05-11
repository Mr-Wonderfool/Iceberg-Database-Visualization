import re
from datetime import datetime, timedelta


def get_update_datetime(days, revised_date):
    revised_year = revised_date.year
    if days > revised_date.timetuple().tm_yday:
        revised_year = revised_year - 1
    date = datetime(revised_year, 1, 1) + timedelta(days - 1)
    return date.strftime("%m/%d/%y")


def dms2dec(dms_str: str) -> float | None:
    """
    Converts a DMS (Degrees, Minutes) string to decimal degrees.
    Strictly expects the format: "(degree: int) (minute: int)'[NEWS]"
    >>> "75 45'S"
    """
    if not dms_str:
        return None

    pattern = re.compile(r"^(\d+)\s(\d+)'([NSEW])$")
    match = pattern.match(dms_str.strip().upper())  # Strip and uppercase for consistency

    if not match:
        # error handling logic here
        return None

    degrees_str, minutes_str, direction = match.groups()

    degrees = int(degrees_str)
    minutes = int(minutes_str)

    decimal_degrees = degrees + (minutes / 60.0)

    if direction in ["S", "W"]:
        decimal_degrees = -decimal_degrees

    return decimal_degrees


def dec2dms(decimal_degrees: str, is_latitude: bool) -> str:
    """
    Convert Decimal (represented by string) to DMS, format {degree} {minutes}'[NEWS]
    """
    decimal_degrees = float(decimal_degrees)
    abs_dd = abs(decimal_degrees)
    degrees = int(abs_dd)
    minutes_float = (abs_dd - degrees) * 60
    minutes = int(minutes_float)
    # seconds = round((minutes_float - minutes) * 60, 2)

    if is_latitude:
        direction = "N" if decimal_degrees >= 0 else "S"
    else:
        direction = "E" if decimal_degrees >= 0 else "W"

    # if seconds > 0:
    #     return f"{degrees} {minutes}'{seconds:.2f}\"{direction}"

    return f"{degrees} {minutes}'{direction}"
