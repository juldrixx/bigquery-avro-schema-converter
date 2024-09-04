export function convert(schema, sourceFormat, destinationFormat) {
  const json = JSON.parse(schema);

  if (sourceFormat === "bigquery") validateBigQuerySchema(json);
  else if (sourceFormat === "avro") validateAvroSchema(json);

  if (sourceFormat === "bigquery" && destinationFormat === "avro")
    return convertBigQueryToAvro(json);
  else if (sourceFormat === "avro" && destinationFormat === "bigquery")
    return convertAvroToBigQuery(json.fields);
}

export function convertBigQueryToAvro(schema, recordName = "schema") {
  const result = {
    name: recordName,
    type: "record",
    fields: [],
  };

  for (const { name, type, mode, description = "", fields = [] } of schema) {
    const field = {
      name,
    };

    if (description.length > 0) field.doc = description;

    field.type = generateAvroType(type, mode, name, fields);

    result.fields.push(field);
  }

  return result;
}

export function convertAvroToBigQuery(schema = []) {
  const result = [];

  for (const { name, type, doc = "", fields = [] } of schema) {
    const field = generateBigQueryField(type, name, doc, fields);

    result.push(field);
  }

  return result;
}

export function validateBigQuerySchema(schema) {
  if (!(schema instanceof Object))
    throw new Error("The schema is not a valid JSON");
  if (!Array.isArray(schema)) throw new Error("The JSON must be an array");
}

export function validateAvroSchema(schema) {
  if (!(schema instanceof Object))
    throw new Error("The schema is not a valid JSON");
  if (Array.isArray(schema)) throw new Error("The JSON must not be an array");
}

export function convertBigQueryTypeToAvroType(type, mode, name, fields) {
  switch (type) {
    case "STRING":
      return "string";
    case "BYTES":
      return "bytes";
    case "INTEGER":
      return "long";
    case "FLOAT":
      return "double";
    case "NUMERIC":
      return { type: "bytes", logicalType: "decimal", precision: 38, scale: 9 };
    case "BIGNUMERIC":
      return {
        type: "bytes",
        logicalType: "decimal",
        precision: 76,
        scale: 38,
      };
    case "BOOLEAN":
      return "boolean";
    case "TIMESTAMP":
      return { type: "long", logicalType: "timestamp-millis" };
    case "DATE":
      return { type: "int", logicalType: "date" };
    case "TIME":
      return { type: "int", logicalType: "time-millis" };
    case "DATETIME":
      return { type: "long", logicalType: "local-timestamp-millis" };
    case "GEOGRAPHY":
      return "string";
    case "RECORD":
      if (isBigQueryMapType(type, mode, fields)) {
        const value = fields.find(({ name }) => name === "value");
        return {
          type: "map",
          values: generateAvroType(
            value.type,
            value.mode,
            value.name,
            value.fields
          ),
          default: {},
        };
      } else return convertBigQueryToAvro(fields, name);
    case "JSON":
      return "string";
    case "RANGE":
      return "string";
    default:
      return "";
  }
}

export function convertAvroTypeToBigQueryType(type, name, fields) {
  if (!(type instanceof Object)) {
    switch (type) {
      case "string":
        return "STRING";
      case "bytes":
        return "BYTES";
      case "int":
      case "long":
        return "INTEGER";
      case "float":
      case "double":
        return "FLOAT";
      case "NUMERIC":
        return {
          type: "bytes",
          logicalType: "decimal",
          precision: 38,
          scale: 9,
        };
      case "BIGNUMERIC":
        return {
          type: "bytes",
          logicalType: "decimal",
          precision: 76,
          scale: 38,
        };
      case "boolean":
        return "BOOLEAN";
      default:
        return "";
    }
  } else {
    if (isAvroMapType(type)) return "RECORD";
    else if (isAvroRecordType(type)) return "RECORD";
    else if (isAvroDateTimeType(type)) return "DATETIME";
    else if (isAvroTimestampType(type)) return "TIMESTAMP";
    else if (isAvroTimeType(type)) return "TIME";
    else if (isAvroDateType(type)) return "DATE";
    else return "";
  }
}

export function isBigQueryMapType(type, mode, fields) {
  return (
    type === "RECORD" &&
    mode === "REPEATED" &&
    fields.length === 2 &&
    fields.some(({ name, type }) => name === "key" && type === "STRING") &&
    fields.some(({ name }) => name === "value")
  );
}

export function isAvroMapType(type) {
  return type instanceof Object && type.type === "map";
}

export function isAvroArrayType(type) {
  return type instanceof Object && type.type === "array";
}

export function isAvroRecordType(type) {
  return type instanceof Object && type.type === "record";
}

export function isAvroDateType(type) {
  return type instanceof Object && type.logicalType === "date";
}

export function isAvroDateTimeType(type) {
  return (
    type instanceof Object &&
    (type.logicalType === "local-timestamp-millis" ||
      type.logicalType === "local-timestamp-micros")
  );
}

export function isAvroTimeType(type) {
  return (
    type instanceof Object &&
    (type.logicalType === "time-millis" || type.logicalType === "time-micros")
  );
}

export function isAvroTimestampType(type) {
  return (
    type instanceof Object &&
    (type.logicalType === "timestamp-millis" ||
      type.logicalType === "timestamp-micros")
  );
}

export function generateAvroType(type, mode, name, fields) {
  const t = convertBigQueryTypeToAvroType(type, mode, name, fields);
  if (mode === "NULLABLE") {
    return ["null", t];
  } else if (mode === "REPEATED" && !isBigQueryMapType(type, mode, fields)) {
    return {
      type: "array",
      items: t,
      default: [],
    };
  } else {
    return t;
  }
}

export function generateBigQueryField(type, name, doc, fields) {
  const field = {
    name,
    mode: "REQUIRED",
  };

  if (doc.length > 0) field.description = doc;

  let t = type;
  if (Array.isArray(t)) {
    if (t.includes("null")) {
      field.mode = "NULLABLE";
    }
    t = t.filter((value) => value !== "null")[0];
  }

  if (isAvroArrayType(t)) {
    field.mode = "REPEATED";
    t = t.items;
  }

  field.type = convertAvroTypeToBigQueryType(t);
  if (isAvroMapType(t)) {
    field.mode = "REPEATED";
    field.fields = [
      {
        name: "key",
        type: "STRING",
        mode: "REQUIRED",
        description: "Map key",
      },
    ];
    field.fields.push(generateBigQueryField(t.values, "value", "Map value"));
  } else if (isAvroRecordType(t)) {
    field.fields = convertAvroToBigQuery(t.fields);
  }

  return field;
}
