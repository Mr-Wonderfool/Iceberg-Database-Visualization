import io
import os
import json
import pandas as pd
from flask import jsonify, send_file, Blueprint
import matplotlib.pyplot as plt

from ..utils.hooks import dms2dec
from ..models import IcebergInfo, Iceberg

iceberg_info_bp = Blueprint("iceberg_info", __name__)


@iceberg_info_bp.route("/new_data", methods=["GET"])
def get_iceberg_data():
    """Sending newest data to frontend"""
    data_path = os.path.abspath(os.path.join(__file__, "../../../data/data/icebergs.json"))
    with open(data_path, "r", encoding="utf-8") as fp:
        iceberg_locations = json.load(fp)
    cleaned_data = []
    for icebergs in iceberg_locations.values():
        for each in icebergs:
            cleaned_data.append(each)
    df = pd.DataFrame(cleaned_data).drop(columns=["latitude", "longitude"])
    return jsonify(df.to_dict(orient="records"))


@iceberg_info_bp.route("/trajectory/<string:iceberg_id>", methods=["GET"])
def iceberg_trajectory(iceberg_id):
    """Return trajectory plot and basic iceberg info (mask, size)"""
    iceberg_info = IcebergInfo.query.filter_by(iceberg_id=iceberg_id).order_by(IcebergInfo.record_time.asc()).all()
    if not iceberg_info:
        return jsonify({"error": "Iceberg not found"}), 404
    dates = [info.record_time for info in iceberg_info]
    longitudes = [dms2dec(info.dms_longitude) for info in iceberg_info]
    latitudes = [dms2dec(info.dms_latitude) for info in iceberg_info]
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.scatter(longitudes, latitudes, marker="*", color="b", label="Locations", s=30)
    ax.set_title(f"Iceberg Trajectory-{iceberg_id}")
    ax.set_xlabel("Longitude", fontsize=12)
    ax.set_ylabel("Latitude", fontsize=12)
    ax.grid(True)
    ax.legend()
    plt.text(
        longitudes[-1],
        latitudes[-1],
        dates[-1].strftime("%Y-%m-%d"),
        fontsize=8,
        color="black",
    )
    plt.text(
        longitudes[0],
        latitudes[0],
        dates[0].strftime("%Y-%m-%d"),
        fontsize=8,
        color="black",
    )
    img = io.BytesIO()
    fig.savefig(img, format="png")
    img.seek(0)
    return send_file(img, mimetype="image/png", as_attachment=False)


@iceberg_info_bp.route("/basic/<string:iceberg_id>", methods=["GET"])
def iceberg_basic_info(iceberg_id):
    """Area and mask information"""
    # query for mask and area
    iceberg = Iceberg.query.filter_by(id=iceberg_id).first()
    if iceberg:
        area = iceberg.area
        mask = iceberg.mask.name
        return jsonify({"area": area, "mask": mask})
    else:
        return jsonify({"area": 0.0, "mask": "NO_DATA"})
