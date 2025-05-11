import os
import csv
import json
from datetime import datetime

from ..config import ROOT_PWD
from .types import MaskType, UserType
from ..models import Iceberg, IcebergInfo, User
from .hooks import read_current_iceberg_location, get_iceberg_details, save_data_as_file
from .utils import dms2dec


def initialize_db(data_dir, db):
    def load_basic_data():
        csv_files = [f for f in os.listdir(data_dir) if f.endswith(".csv")]

        for csv_file in csv_files:
            iceberg_id = os.path.splitext(csv_file)[0]
            file_path = os.path.join(data_dir, csv_file)
            with open(file_path, "r") as file:
                reader = csv.DictReader(file)
                rows = list(reader)
                area = [row["size"] for row in rows if float(row["size"]) > 10.0]
                size = 0.0 if 0 == len(area) else area[-1]
                for row in rows[-10:]:  # ! process the last ten rows
                    date_str = row["date"]
                    date_obj = datetime.strptime(date_str, "%Y%j")  # Convert YYYDDD format
                    latitude = float(row["lat"])
                    longitude = float(row["lon"])
                    mask = MaskType(int(row["mask"])).name  # should convert to Enum
                    vel_angle = float(row["vel_angle"]) if row["vel_angle"] else None
                    # ! create iceberg before iceberg info
                    iceberg = Iceberg.query.filter_by(id=iceberg_id).first()
                    if not iceberg:
                        iceberg = Iceberg(id=iceberg_id, mask=mask, area=size)
                        db.session.add(iceberg)
                    else:
                        iceberg.mask = mask  # update mask to align with new values
                    # info entry
                    iceberg_info = IcebergInfo(
                        iceberg_id=iceberg_id,
                        latitude=latitude,
                        longitude=longitude,
                        rotational_velocity=vel_angle,
                        record_time=date_obj,
                        is_prediction=False,
                    )
                    db.session.add(iceberg_info)

                db.session.commit()
                db.session.close()

    def create_superuser():
        root = User(username="root", email="root", role=UserType.MANAGER)
        root.password = ROOT_PWD
        db.session.add(root)
        db.session.commit()

    load_basic_data()
    create_superuser()


def get_new_data(scraped_json_path, db):
    # scrape newest data from scp database
    current_location_data, revised_date = read_current_iceberg_location()
    detailed_location_details = get_iceberg_details(current_location_data, revised_date)
    save_data_as_file(detailed_location_details, revised_date, data_path=scraped_json_path)
    with open(scraped_json_path, "r", encoding="utf-8") as file:
        iceberg_locations = json.load(file)

    for _, iceberg_list in iceberg_locations.items():
        for iceberg_data in iceberg_list:
            iceberg_id = iceberg_data["iceberg_id"]
            dms_longitude = iceberg_data["dms_longitude"]
            dms_latitude = iceberg_data["dms_latitude"]
            longitude, latitude = dms2dec(dms_longitude), dms2dec(dms_latitude)
            # if conversion failed, then dms not in proper format, consider this data to be invalid
            if longitude is None or latitude is None:
                continue
            recent_observation_date = datetime.strptime(iceberg_data["recent_observation"], "%m/%d/%y")
            iceberg = Iceberg.query.filter_by(id=iceberg_id).first()
            if not iceberg:
                iceberg = Iceberg(id=iceberg_id, mask=MaskType.NO_DATA, area=0.0)
                db.session.add(iceberg)
            iceberg_info = IcebergInfo(
                iceberg_id=iceberg_id,
                longitude=dms2dec(dms_longitude),
                latitude=dms2dec(dms_latitude),
                record_time=recent_observation_date,
                is_prediction=False,  # Assuming it's not a prediction for now
            )

            db.session.add(iceberg_info)
        db.session.commit()
        db.session.close()