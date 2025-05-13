from flask import Blueprint, request, jsonify
from sqlalchemy import and_
import datetime
from datetime import timezone, timedelta
from dateutil.relativedelta import relativedelta
import numpy as np
from scipy.interpolate import interp1d

from ..models import db, Iceberg, IcebergInfo
from ..utils.utils import extrapolate_trajectory_polynomial

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
        one_year_range = current_date - relativedelta(months=120)
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
    """Query Iceberg Table with the input id, and return trajectory-related information,
    including predictions from curve interpolation.
    Assumptions: 1. flat surface (curvature not taking into account)
    2. constant velocity
    3. enough data points
    """
    iceberg_obj = db.session.get(Iceberg, iceberg_id)
    if not iceberg_obj:
        return jsonify({"error": "Iceberg not found"}), 404

    trajectory_points = []
    iceberg_info = IcebergInfo.query.filter_by(iceberg_id=iceberg_id).order_by(IcebergInfo.record_time.asc())
    historical_info = iceberg_info.all()

    for info in historical_info:
        lat_decimal = info.latitude
        lon_decimal = info.longitude

        trajectory_points.append(
            {
                "latitude": lat_decimal,
                "longitude": lon_decimal,
                "record_time": info.record_time.replace(tzinfo=timezone.utc).isoformat(),
                "is_prediction": info.is_prediction,
            }
        )

    predicted_trajectory_points = []
    # --- Extrapolation Logic 1: direct polyfit ---
    # Use the last N points for fitting the extrapolation model.
    # N should be greater than the polynomial degree.

    num_points_for_fit = min(len(trajectory_points), 10)

    if num_points_for_fit >= 2:
        fitting_points = trajectory_points[-num_points_for_fit:]
        fit_start_time_dt = datetime.datetime.fromisoformat(fitting_points[0]["record_time"].replace("Z", "+00:00"))

        relative_times_fit = np.array(
            [
                (datetime.datetime.fromisoformat(p["record_time"].replace("Z", "+00:00")) - fit_start_time_dt).total_seconds()
                for p in fitting_points
            ]
        )
        lats_fit = np.array([p["latitude"] for p in fitting_points])
        lons_fit = np.array([p["longitude"] for p in fitting_points])

        latest_historical_time_dt = datetime.datetime.fromisoformat(trajectory_points[-1]["record_time"].replace("Z", "+00:00"))

        prediction_interval_days = 10
        num_predictions = 10  # Predict for 100 days
        future_relative_times_predict = []

        for i in range(1, num_predictions + 1):
            future_delta_days = i * prediction_interval_days
            future_time_dt = (latest_historical_time_dt + timedelta(days=future_delta_days)).replace(
                tzinfo=timezone.utc
            )
            future_relative_times_predict.append((future_time_dt - fit_start_time_dt).total_seconds())

        future_relative_times_predict_np = np.array(future_relative_times_predict)

        # Define polynomial degree for extrapolation
        extrapolation_degree = 2

        try:
            pred_lats = extrapolate_trajectory_polynomial(
                relative_times_fit, lats_fit, future_relative_times_predict_np, degree=extrapolation_degree
            )
            pred_lons = extrapolate_trajectory_polynomial(
                relative_times_fit, lons_fit, future_relative_times_predict_np, degree=extrapolation_degree
            )

            current_future_time_dt = latest_historical_time_dt
            for i in range(num_predictions):
                if i >= len(pred_lats):  # Should not happen if extrapolate_trajectory_polynomial returns full array
                    break

                current_future_time_dt = (
                    latest_historical_time_dt + timedelta(days=(i + 1) * prediction_interval_days)
                ).replace(tzinfo=timezone.utc)

                pred_lat_val = float(pred_lats[i])
                pred_lon_val = float(pred_lons[i])

                # Sanity checks
                pred_lat_val = max(-90.0, min(90.0, pred_lat_val))
                pred_lon_val = ((pred_lon_val + 180) % 360) - 180

                predicted_trajectory_points.append(
                    {
                        "latitude": pred_lat_val,
                        "longitude": pred_lon_val,
                        "record_time": current_future_time_dt.isoformat(),
                        "is_prediction": True,
                    }
                )

        except np.linalg.LinAlgError as lae:
            print(f"LinAlgError during polynomial fitting for iceberg {iceberg_id}: {lae}")
        except Exception as e:
            return jsonify({"error": f"Interpolation failed for {iceberg_id}"}), 500

    # # --- Extrapolation Logic 2: interpolation, and linear extrapolation --
    # predicted_trajectory_points = []
    # if len(trajectory_points) >= 2: # Need at least 2 points for interpolation
    #     # Prepare data for interpolation
    #     times = np.array([(datetime.datetime.datetime.fromisoformat(p["record_time"].replace('Z', '+00:00')) - datetime.datetime.datetime.fromisoformat(trajectory_points[0]["record_time"].replace('Z', '+00:00'))).total_seconds() for p in trajectory_points])
    #     lats = np.array([p["latitude"] for p in trajectory_points])
    #     lons = np.array([p["longitude"] for p in trajectory_points])

    #     # For extrapolation, 'linear' is often safer given the iceberg path is twisted
    #     interpolation_kind = 'linear'

    #     try:
    #         interp_lat = interp1d(times, lats, kind=interpolation_kind, fill_value="extrapolate", bounds_error=False)
    #         interp_lon = interp1d(times, lons, kind=interpolation_kind, fill_value="extrapolate", bounds_error=False)
    #         latest_record_time_dt = datetime.datetime.datetime.fromisoformat(trajectory_points[-1]["record_time"].replace('Z', '+00:00'))

    #         # Generate future timestamps (10 points, 10 days interval, for 100 days)
    #         prediction_interval_days = 10
    #         num_predictions = 10

    #         for i in range(1, num_predictions + 1):
    #             future_delta_days = i * prediction_interval_days
    #             future_time_dt = latest_record_time_dt + timedelta(days=future_delta_days)
    #             future_time_seconds_since_start = (future_time_dt - datetime.datetime.datetime.fromisoformat(trajectory_points[0]["record_time"].replace('Z', '+00:00'))).total_seconds()

    #             pred_lat = float(interp_lat(future_time_seconds_since_start))
    #             pred_lon = float(interp_lon(future_time_seconds_since_start))

    #             pred_lat = max(-90.0, min(90.0, pred_lat))
    #             pred_lon = ((pred_lon + 180) % 360) - 180 # Normalize longitude to [-180, 180]

    #             predicted_trajectory_points.append({
    #                 "latitude": pred_lat,
    #                 "longitude": pred_lon,
    #                 "record_time": future_time_dt.replace(tzinfo=timezone.utc).isoformat(),
    #                 "is_prediction": True,
    #             })

    #     except Exception as e:
    #         return jsonify({"error": f"Interpolation failed for {iceberg_id}"}), 500

    result = {
        "id": iceberg_obj.id,
        "area": iceberg_obj.area,
        "mask": iceberg_obj.mask.value if iceberg_obj.mask else None,
        "trajectory": trajectory_points,
        "predicted_trajectory": predicted_trajectory_points,
    }

    # consider adding predictions to IcebergInfo, but this will make the table too large

    return jsonify(result)
