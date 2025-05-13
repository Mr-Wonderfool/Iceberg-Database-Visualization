from flask import Blueprint, jsonify
from sqlalchemy import func, extract, and_, case, asc

from ..models import db, Iceberg, IcebergInfo

vis_api_bp = Blueprint("vis_api", __name__)


@vis_api_bp.route("/size_distribution", methods=["GET"])
def get_size_distribution():
    """
    Provides data for iceberg size distribution (area).
    Returns bins and counts for a histogram.
    """
    try:
        bins = [0.1, 10, 20, 30, 50, 100, 500, 1000, 3000, 5000, 7000, 10000, float("inf")]
        bin_labels = []
        for i in range(len(bins) - 1):
            lower_bound = bins[i]
            upper_bound = bins[i + 1]

            # Adjust label for the first bin if it starts at 0
            if i == 0 and lower_bound == 0:
                label_lower = f"< {upper_bound:.2f}" if upper_bound != float("inf") else f"{lower_bound:.2f}+"
            else:
                label_lower = f"{lower_bound:.2f}"

            if upper_bound == float("inf"):
                bin_labels.append(f"{label_lower}+ km²")
            else:
                if i == 0 and bins[i] == 0:
                    bin_labels.append(f"< {upper_bound:.2f} km²")
                else:
                    bin_labels.append(f"{lower_bound:.2f}-{upper_bound:.2f} km²")

        # Ensure the case statement correctly handles the exclusive upper bound
        # For area BETWEEN lower AND upper, SQL BETWEEN is inclusive.
        # We actually want [lower, upper)
        conditions = []
        for i in range(len(bin_labels)):
            lower = bins[i]
            upper = bins[i + 1]
            if upper == float("inf"):
                conditions.append((Iceberg.area >= lower, bin_labels[i]))
            else:
                conditions.append((and_(Iceberg.area >= lower, Iceberg.area < upper), bin_labels[i]))

        case_statement = case(*conditions, else_="Other").label("area_bin")

        results = db.session.query(case_statement, func.count(Iceberg.id).label("count")).group_by("area_bin").all()

        results_dict = {res.area_bin: res.count for res in results}

        histogram_data = []
        for label in bin_labels:
            histogram_data.append({"name": label, "value": results_dict.get(label, 0)})

        # Handle the "Other" category if it appears (shouldn't if bins are comprehensive)
        if "Other" in results_dict and results_dict["Other"] > 0:
            histogram_data.append({"name": "Unobserved", "value": results_dict["Other"]})

        return jsonify(histogram_data)

    except Exception as e:
        return jsonify({"error": "An error occurred fetching size distribution", "details": str(e)}), 500


@vis_api_bp.route("/active_count_over_time", methods=["GET"])
def get_active_count_over_time():
    """
    Provides data for the count of unique active icebergs per month.
    """
    try:
        # Query to get year, month, and count of distinct iceberg_id's
        results = (
            db.session.query(
                extract("year", IcebergInfo.record_time).label("year"),
                extract("month", IcebergInfo.record_time).label("month"),
                func.count(func.distinct(IcebergInfo.iceberg_id)).label("iceberg_count"),
            )
            .group_by("year", "month")
            .order_by("year", "month")
            .all()
        )

        line_chart_data = [
            {
                "time": f"{int(r.year)}-{int(r.month):02d}",  # Format as YYYY-MM
                # "month_name": calendar.month_name[int(r.month)], # Optional: full month name
                "value": r.iceberg_count,
            }
            for r in results
        ]
        return jsonify(line_chart_data)

    except Exception as e:
        return jsonify({"error": "An error occurred fetching active count over time", "details": str(e)}), 500


@vis_api_bp.route("/correlation_data", methods=["GET"])
def get_iceberg_correlation_data():
    """
    Provides data for iceberg area vs. latest rotational velocity.
    """
    try:
        # Subquery to get the latest record_time for each iceberg_id from IcebergInfo
        latest_info_sq = (
            db.session.query(IcebergInfo.iceberg_id, func.max(IcebergInfo.record_time).label("max_record_time"))
            .group_by(IcebergInfo.iceberg_id)
            .subquery("latest_info_sq")
        )

        # Query to get iceberg area and the rotational velocity at the latest record_time
        results = (
            db.session.query(Iceberg.id, Iceberg.area, IcebergInfo.rotational_velocity)
            .join(latest_info_sq, Iceberg.id == latest_info_sq.c.iceberg_id)
            .join(
                IcebergInfo,
                and_(
                    IcebergInfo.iceberg_id == latest_info_sq.c.iceberg_id,
                    IcebergInfo.record_time == latest_info_sq.c.max_record_time,
                ),
            )
            .all()
        )

        correlation_data = [{"id": r.id, "area": r.area, "rotationalVelocity": r.rotational_velocity} for r in results]
        return jsonify(correlation_data)

    except Exception as e:
        return jsonify({"error": "An error occurred fetching correlation data", "details": str(e)}), 500


@vis_api_bp.route("/birth_death_locations", methods=["GET"])
def get_iceberg_birth_death_locations():
    """
    Provides coordinates for estimated birth and death (melt/last known) locations of icebergs.
    """
    try:
        # Subquery for birth locations (first record time)
        first_record_sq = (
            db.session.query(IcebergInfo.iceberg_id, func.min(IcebergInfo.record_time).label("min_time"))
            .group_by(IcebergInfo.iceberg_id)
            .subquery("first_record_sq")
        )

        birth_locations = (
            db.session.query(
                IcebergInfo.iceberg_id,
                IcebergInfo.latitude,
                IcebergInfo.longitude,
                IcebergInfo.record_time,
            )
            .join(
                first_record_sq,
                and_(
                    IcebergInfo.iceberg_id == first_record_sq.c.iceberg_id,
                    IcebergInfo.record_time == first_record_sq.c.min_time,
                ),
            )
            .all()
        )

        # Subquery for death locations (last record time)
        last_record_sq = (
            db.session.query(IcebergInfo.iceberg_id, func.max(IcebergInfo.record_time).label("max_time"))
            .group_by(IcebergInfo.iceberg_id)
            .subquery("last_record_sq")
        )

        death_locations = (
            db.session.query(
                IcebergInfo.iceberg_id,
                IcebergInfo.longitude,
                IcebergInfo.latitude,
                IcebergInfo.record_time,  # Include record_time
            )
            .join(
                last_record_sq,
                and_(
                    IcebergInfo.iceberg_id == last_record_sq.c.iceberg_id,
                    IcebergInfo.record_time == last_record_sq.c.max_time,
                ),
            )
            .all()
        )

        response_data = []
        for loc in birth_locations:
            response_data.append(
                {
                    "id": loc.iceberg_id,
                    "type": "birth",
                    "longitude": loc.longitude,
                    "latitude": loc.latitude,
                    "name": f"Iceberg {loc.iceberg_id} (Birth)",
                    "record_time": loc.record_time.isoformat() if loc.record_time else None,
                }
            )
        for loc in death_locations:
            # Avoid duplicating if birth and death are the same record (iceberg with single entry)
            is_new_event = True
            for birth_event in response_data:
                if (
                    birth_event["id"] == loc.iceberg_id
                    and birth_event["type"] == "birth"
                    and birth_event["record_time"] == (loc.record_time.isoformat() if loc.record_time else None)
                ):
                    is_new_event = False
                    break
            if is_new_event:
                response_data.append(
                    {
                        "id": loc.iceberg_id,
                        "type": "death",
                        "longitude": loc.longitude,
                        "latitude": loc.latitude,
                        "name": f"Iceberg {loc.iceberg_id} (Last Seen)",
                        "record_time": loc.record_time.isoformat() if loc.record_time else None,
                    }
                )

        return jsonify(response_data)

    except Exception as e:
        return jsonify({"error": "An error occurred fetching birth/death locations", "details": str(e)}), 500


@vis_api_bp.route("/iceberg/<string:iceberg_id>/timeseries", methods=["GET"])
def get_iceberg_timeseries_data(iceberg_id):
    """
    Provides time-series data (rotational velocity, area) for a specific iceberg.
    """
    try:
        iceberg_detail = (
            db.session.query(Iceberg.id, Iceberg.mask, Iceberg.area.label("initial_area"))
            .filter(Iceberg.id == iceberg_id)
            .first()
        )

        if not iceberg_detail:
            return jsonify({"error": "Iceberg not found"}), 404

        query = db.session.query(
            IcebergInfo.record_time, IcebergInfo.rotational_velocity, IcebergInfo.area_at_record_time.label("area")
        )

        time_series_records = (
            query.filter(IcebergInfo.iceberg_id == iceberg_id).order_by(asc(IcebergInfo.record_time)).all()
        )

        time_series_data = [
            {
                "record_time": r.record_time.isoformat() if r.record_time else None,
                "rotational_velocity": r.rotational_velocity,
                "area": (r.area),
            }
            for r in time_series_records
        ]

        response = {
            "details": {
                "id": iceberg_detail.id,
                "mask": str(iceberg_detail.mask) if iceberg_detail.mask else None,  # Convert Enum to string
                "initial_area": iceberg_detail.initial_area,
            },
            "time_series": time_series_data,
        }
        return jsonify(response)
    except Exception as e:
        return (
            jsonify({"error": f"An error occurred fetching time series for iceberg {iceberg_id}", "details": str(e)}),
            500,
        )
