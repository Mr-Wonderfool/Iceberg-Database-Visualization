// sign up page
export type UserRegister = {
  email: string;
  password: string;
  username: string;
};

// login page
export type UserLogin = {
  password: string;
  username: string;
};

export type UserPublic = {
  username: string;
  is_signedIn: boolean;
  is_superuser?: boolean;
};

// home page
export type IcebergInfo = {
  iceberg_id: string;
  dms_latitude: string;
  dms_longitude: string;
  recent_observation: string;
};
// detail page
export type IcebergDetails = {
  area: number;
  mask: string;
  comments: Array<{
    comment_id: number;
    user_name: string;
    suggestion: string;
    suggestion_time: string;
  }>;
  newComment: string;
  trajectoryImage: string;
};

export type Message = {
  message: string;
  msgVariant: string;
  msgVisible: boolean;
};

// for location passing between pages
export interface LocationState {
  iceberg_id?: string;
  user_name?: string;
  is_superuser?: boolean;
}