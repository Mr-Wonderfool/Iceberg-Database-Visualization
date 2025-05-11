import requests
import json
from bs4 import BeautifulSoup
from datetime import datetime

from .utils import dms2dec, get_update_datetime

def read_current_iceberg_location():
    """
    Reads the webpage and remove unwanted tags
    """
    scp_byu_html = requests.get(
        "https://www.scp.byu.edu/current_icebergs.html", verify=False
    )

    soup = BeautifulSoup(scp_byu_html.content, "lxml")

    revised_date_str = soup.p.text[-17:]
    revised_date = datetime.strptime(revised_date_str, "%H:%M:%S %m/%d/%y")

    data = []
    rows = []
    tables = soup.table.find_all("table")
    if len(tables) > 0:
        rows = tables[1].table.find_all("tr")

    for row in rows:
        cols = row.find_all("td")
        cols = [ele.text.strip() for ele in cols]
        data.append([ele for ele in cols if ele])  # Get rid of empty values

    return data, revised_date


def get_iceberg_details(location_data, revised_date):
    """
    The formatted location data is returned with last updated data
    """
    result = []
    for index, row in enumerate(location_data):
        if index == 0:
            continue

        observation_date = 0
        if len(row) >= 4:
            observation_date = int(row[3])

        result.append(
            {
                "iceberg_id": row[0],
                "dms_longitude": row[1],
                "dms_latitude": row[2],
                "longitude": dms2dec(row[1]),
                "latitude": dms2dec(row[2]),
                "recent_observation": get_update_datetime(
                    observation_date, revised_date
                ),
            }
        )
    return result


def save_data_as_file(location_details, revised_date, data_path):
    formatted_date = revised_date.strftime("%m/%d/%y")
    with open(data_path, "r+") as fp:
        current_location_details = fp.read()
        if current_location_details:
            current_location_details = json.loads(current_location_details)
            current_location_details[formatted_date] = location_details
        else:
            current_location_details = {formatted_date: location_details}
        json_location_details = json.dumps(current_location_details)
        fp.seek(0)
        fp.truncate(0)
        fp.write(json_location_details)
        fp.close()
