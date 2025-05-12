from flask import Blueprint, request, jsonify
from sqlalchemy import and_
import datetime
from dateutil.relativedelta import relativedelta

from ..models import db, Iceberg, IcebergInfo

iceberg_api_bp = Blueprint("iceberg_api", __name__)


@iceberg_api_bp.route("/iceberg/locations_in_bounds", methods=["GET"])
def get_iceberg_locations_in_bounds():
    """
    Search for icebergs within the given geological bounds.
    Expected query parameters: (minLat, maxLat, minLon, maxLon) in decimal
    """
    try:
        min_lon_str = request.args.get("minLon")
        max_lon_str = request.args.get("maxLon")
        min_lat_str = request.args.get("minLat")
        max_lat_str = request.args.get("maxLat")

        if not all([min_lon_str, max_lon_str, min_lat_str, max_lat_str]):
            return jsonify({"error": "Missing one or more required boundary parameters"}), 400

        min_lon = float(min_lon_str)
        max_lon = float(max_lon_str)
        min_lat = float(min_lat_str)
        max_lat = float(max_lat_str)

        current_date = datetime.datetime.today()
        one_year_range = current_date - relativedelta(months=12)
        filter_date_start = datetime.datetime.combine(one_year_range, datetime.time.min)

        # query icebergInfo with position ranges and date range
        query = db.session.query(IcebergInfo.latitude, IcebergInfo.longitude).filter(
            and_(
                IcebergInfo.latitude.between(min_lat, max_lat),
                IcebergInfo.longitude.between(min_lon, max_lon),
                IcebergInfo.record_time >= filter_date_start,
            )
        )
        results = query.all()

        locations = []
        for lat, lon in results:
            # for leaflet.heat, need to return format [lat, lng, density]
            locations.append([lat, lon, 1.0])
        return jsonify(locations)

    except ValueError:
        return jsonify({"error": "Invalid boundary parameter format, must be numbers"}), 400

    except Exception as e:
        return jsonify({"error": f"An exception occurred when fetching heatmap data. Details: {str(e)}"}), 500


@iceberg_api_bp.route("/iceberg/<string:iceberg_id>", methods=["GET"])
def get_iceberg_by_id(iceberg_id: str):
    """Query Iceberg Table with the input id, and return trajectory-related information"""
    iceberg_obj = Iceberg.query.filter_by(id=iceberg_id).first()
    if not iceberg_obj:
        return jsonify({"error": "Iceberg not found"}), 404

    trajectory_points = []
    iceberg_info = IcebergInfo.query.filter_by(iceberg_id=iceberg_id).order_by(IcebergInfo.record_time.asc())
    for info in iceberg_info.all():
        lat_decimal = info.latitude
        lon_decimal = info.longitude

        trajectory_points.append(
            {
                "latitude": lat_decimal,
                "longitude": lon_decimal,
                "record_time": info.record_time.isoformat() + "Z",
                "is_prediction": info.is_prediction,
            }
        )
    result = {
        "id": iceberg_obj.id,
        "area": iceberg_obj.area,
        "mask": iceberg_obj.mask.value if iceberg_obj.mask else None,
        "trajectory": trajectory_points,
    }

    return jsonify(result)
