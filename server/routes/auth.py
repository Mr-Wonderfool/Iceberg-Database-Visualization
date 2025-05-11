from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token

from ..models import User, db
from ..utils.types import UserType

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.json
    username = data.get("username")
    pwd = data.get("password")
    email = data.get("email")
    if User.query.filter_by(username=username).first():
        return jsonify({"msg": "User already exists"}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "User with same email already exists"}), 409
    user = User(username=username, email=email)
    user.password = pwd
    try:
        db.session.add(user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": e}), 500
    return jsonify({"msg": "User created successfully"}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    pwd = data.get("password")
    user: User = User.query.filter_by(username=username).first()
    if user and user.check_pwd(pwd):
        is_superuser = True if UserType.MANAGER == user.role else False
        access_token = create_access_token(identity=user.username)
        return (
            jsonify({"access_token": access_token, "is_superuser": is_superuser}),
            200,
        )
    return jsonify({"msg": "Bad Credentials"}), 401
