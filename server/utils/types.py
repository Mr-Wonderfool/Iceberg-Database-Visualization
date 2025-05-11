from enum import Enum


class UserType(Enum):
    MANAGER = "manager"
    COMMON_USER = "common_user"
    COMPANY_USER = "company_user"


class MaskType(Enum):
    NEAR_LAND = 0
    SEA_ICE = 1
    OPEN_OCEAN = 2
    NO_DATA = 3
