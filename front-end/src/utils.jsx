export function inner_flatmap(complex_obj, field_name, flat_obj) {
  for (const [key, value] of Object.entries(complex_obj)) {
    if (field_name in value) {
      flat_obj[key] = value[field_name];
    } else {
      inner_flatmap(value, field_name, flat_obj);
    }
  }
}

export function flatmap(complex_obj, field_name) {
  const flat_obj = {};
  inner_flatmap(complex_obj, field_name, flat_obj);
  return flat_obj;
}
