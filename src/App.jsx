import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import {
  Box,
  createTheme,
  CssBaseline,
  debounce,
  Stack,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import GitHubButton from "./component/GitHubButton";
import JsonInput from "./component/JsonInput";
import ThemePicker from "./component/ThemePicker";
import LogoAvroToBigQuery from "./img/avro_to_bigquery.png";
import LogoBigQueryToAvro from "./img/bigquery_to_avro.png";
import Logo from "./img/logo.png";
import { convert } from "./util";

const theme = createTheme({
  colorSchemes: {
    dark: true,
  },
});

function App() {
  const [focus, setFocus] = useState(null);
  const [bigquery, setBigQuery] = useState("");
  const [avro, setAvro] = useState("");
  const [bigQueryError, setBigQueryError] = useState(null);
  const [avroError, setAvroError] = useState(null);

  const convertCallback = (schema, sourceFormat, destinationFormat) => {
    try {
      const result = convert(schema, sourceFormat, destinationFormat);
      destinationFormat === "bigquery"
        ? setBigQuery(JSON.stringify(result, null, 2))
        : setAvro(JSON.stringify(result, null, 2));
      setBigQueryError(null);
      setAvroError(null);
    } catch (e) {
      sourceFormat === "bigquery"
        ? setBigQueryError(e.message)
        : setAvroError(e.message);
    }
  };

  const debouncedConvert = useMemo(() => debounce(convertCallback, 1000), []);

  const handleBigQueryFocus = () => {
    setFocus("bigquery");
  };

  const handleAvroFocus = () => {
    setFocus("avro");
  };

  const handleBigQueryChange = (value) => {
    setBigQuery(value);
    debouncedConvert(value, "bigquery", "avro");
  };

  const handleAvroChange = (value) => {
    setAvro(value);
    debouncedConvert(value, "avro", "bigquery");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        width="100%"
        height="100%"
        bgcolor={(theme) => theme.palette.background.paper}
      >
        <ThemePicker />
        <Stack
          direction="column"
          gap={2}
          alignItems="center"
          justifyContent="space-between"
          padding={2}
        >
          <Typography variant="h1" fontWeight={700}>
            BigQuery &lt;&gt; Avro
          </Typography>
          <Typography variant="h2" fontWeight={700}>
            Schema Converter
          </Typography>
          <Stack
            direction="row"
            alignItems="start"
            justifyContent="space-between"
            gap={2}
            width="100%"
          >
            <JsonInput
              onFocus={handleBigQueryFocus}
              onChange={handleBigQueryChange}
              value={bigquery}
              error={bigQueryError}
            />
            <Stack height="500px" justifyContent="center" alignItems="center">
              <img
                src={
                  focus === null
                    ? Logo
                    : focus === "bigquery"
                    ? LogoBigQueryToAvro
                    : LogoAvroToBigQuery
                }
                alt={
                  focus === null
                    ? Logo
                    : focus === "No conversion in progress"
                    ? "Convert BigQuery to Avro"
                    : "Convert Avro to BigQuery"
                }
                style={{
                  width: 100,
                  height: 100,
                }}
              />
            </Stack>
            <JsonInput
              onFocus={handleAvroFocus}
              onChange={handleAvroChange}
              value={avro}
              error={avroError}
            />
          </Stack>
          <GitHubButton />
        </Stack>
      </Box>
    </ThemeProvider>
  );
}

export default App;
