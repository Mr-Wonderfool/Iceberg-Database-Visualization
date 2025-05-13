import re
import numpy as np
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

def extrapolate_trajectory_polynomial(times_seconds, values, future_times_seconds, degree=2):
    """
    Extrapolates values to future_times_seconds using polynomial fitting.
    
    :param times_seconds: NumPy array of historical time points (in seconds, relative).
    :param values: NumPy array of historical values (lat or lon).
    :param future_times_seconds: NumPy array of future time points to predict (in seconds, relative to same epoch as times_seconds).
    :param degree: Degree of the polynomial to fit.
    :return: NumPy array of predicted values.
    """
    if len(times_seconds) < degree + 1:
        # Not enough data points for the desired polynomial degree.
        # Fallback to linear extrapolation if at least 2 points, otherwise no extrapolation.
        if len(times_seconds) >= 2:
            # Linear fit (degree 1)
            coeffs = np.polyfit(times_seconds, values, 1)
            poly_func = np.poly1d(coeffs)
            return poly_func(future_times_seconds)
        elif len(times_seconds) == 1: # Can't extrapolate with one point, return the point itself for all future times (static)
             return np.full_like(future_times_seconds, values[0], dtype=float)
        else: # No data to extrapolate from
            return np.array([])

    # Fit polynomial of the given degree
    coeffs = np.polyfit(times_seconds, values, degree)
    poly_func = np.poly1d(coeffs)
    predicted_values = poly_func(future_times_seconds)
    return predicted_values