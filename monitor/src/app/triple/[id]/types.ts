export interface Setting {
  id: number;
  department: string;
  n_hospital: string;
  n_room: string;
  n_table: string;
  n_listtable: string;
  n_listroom: string;
  department_load: string;
  department_room_load: string;
  time_col: string;
  table_arr: string;
  table_arr2: string;
  amount_boxL: number;
  amount_boxR: number;
  stem_surname: string;
  stem_surname_table: string;
  stem_surname_popup: string;
  stem_name_table: string | null;
  stem_name_popup: string | null;
  station_l: string;
  station_r: string;
  stem_popup: string;
  a_sound: string;
  b_sound: string;
  c_sound: string;
  stem_name: string | null;
  urgent_color: string;
  lock_position: string;
  lock_position_right: string;
  urgent_level: string;
  status_patient: string;
  status_check: string;
  ads: string;
  ads_type?: string;
  enable_ads?: boolean;
  ads_path_left?: string;
  ads_path_right?: string;
  timeout: string | null;
  pages: string | null;
  urgent_setup: string;
  type: string | null;
  alternate: string | null;
  voice: string | null;
  style_voice: string | null;
  set_descrip: string;
  set_notice: string;
  type_popup: string;
  time_wait: string;
  listPage: string;
  limitNum: string | null;
  speedLoop: string | null;
  activeLoop: string | null;
  font?: string;
  color_static?: string | null;
  color_dynamic?: string | null;
  list_urgent?: string | null;
  display_three_columns?: string;
  column_title_1?: string;
  column_title_2?: string;
  column_title_3?: string;
}

export interface VisitInfo {
  id?: number;
  code_dept_id?: string;
  patient_name?: string;
  queue_number?: string;
  visit_date?: string;
  status?: string;
  urgent_id?: number;
  urgent_color?: string;
  urgent_setup?: string;
  urgent_level?: string;
  priority_rate?: number;
  check_in?: string;
  time_call?: string;
  status_call?: string;
  arr_r?: boolean | string;
  station_index?: number;
  [key: string]: string | number | boolean | null | undefined;
}






