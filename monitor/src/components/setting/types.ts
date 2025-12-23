export interface PayloadData {
  type: string;
  typeMonitor: string;
  n_hospital: string;
  n_department: string;
  department: string;
  head_left: string;
  head_right: string;
  urgent_setup: string;
  time_wait: number;
  amount_left: number;
  amount_right: number;
  arr_l: boolean;
  arr_r: boolean;
  set_descrip: boolean;
  set_notice: boolean;
  stem_surname: string;
  type_popup: string;
  stem_popup: string;
  stem_surname_popup: string;
  stem_surname_table: string;
  stem_name: string;
  stem_name_table: string;
  urgent_color: boolean;
  status_patient: boolean;
  status_check: boolean;
  lock_position: boolean;
  lock_position_right: boolean;
  urgent_level: boolean;
  a_sound: boolean;
  b_sound: boolean;
  c_sound: boolean;
  time_col: boolean;
  station_left: string;
  station_right: string;
  query_left: string;
  query_right: string;
  listPage: string;
  style_voice: 'female' | 'male';
  voice: string;
}

export interface SettingData {
  id: string;
  type: string;
  n_hospital: string;
  n_department: string;
  department?: string; // field จาก API /api/id-setting
  head_left: string;
  head_right: string;
  amount_left: number;
  amount_right: number;
  query_left: string;
  query_right: string;
  station_left?: string;
  station_right?: string;
}

