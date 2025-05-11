from datetime import datetime
from flask import jsonify, request, Blueprint

from ..models import db, VesselSuggestion

comment_bp = Blueprint("comments", __name__, url_prefix="/comments")


@comment_bp.route("/", methods=["POST"])
def add_comment():
    """add comments for vessels"""
    data = request.json
    iceberg_id = data.get("iceberg_id")
    suggestion = data.get("suggestion")
    user_name = data.get("user_name")
    suggestion_time = datetime.fromisoformat(data.get("suggestion_time"))

    comment = VesselSuggestion(
        iceberg_id=iceberg_id,
        suggestion=suggestion,
        user_name=user_name,
        suggestion_time=suggestion_time,
    )
    db.session.add(comment)
    db.session.commit()

    return (
        jsonify(
            {
                "message": "Comment added successfully! Thanks for commenting",
                "comment_id": comment.suggestion_id,
            }
        ),
        201,
    )


@comment_bp.route("/<string:iceberg_id>", methods=["GET"])
def get_comments(iceberg_id):
    """Get comments posted by user"""
    comments = VesselSuggestion.query.filter_by(iceberg_id=iceberg_id).limit(5).all()
    comments_data = [
        {
            "comment_id": comment.suggestion_id,
            "user_name": comment.user_name,
            "suggestion": comment.suggestion,
            "suggestion_time": comment.suggestion_time.strftime("%Y-%m-%d"),
        }
        for comment in comments
    ]
    return jsonify(comments_data)


@comment_bp.route("/<int:comment_id>", methods=["DELETE"])
def delete_comment(comment_id):
    """Delete a comment by id"""
    comment = VesselSuggestion.query.get(comment_id)
    if not comment:
        return jsonify({"Error": "Comment not Found"}), 404
    db.session.delete(comment)
    db.session.commit()
    return jsonify({"Message": "Comment deleted successfully!"}), 200
