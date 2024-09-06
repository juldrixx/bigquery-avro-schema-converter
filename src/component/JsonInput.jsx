import { json } from "@codemirror/lang-json";
import { Stack, Typography, useTheme } from "@mui/material";
import { materialDark, materialLight } from "@uiw/codemirror-theme-material";
import ReactCodeMirror from "@uiw/react-codemirror";
import PropTypes from "prop-types";

export default function JsonInput({
  onFocus = () => {},
  onChange = () => {},
  value = "",
  error = null,
}) {
  const theme = useTheme();

  return (
    <Stack
      direction="column"
      alignItems="start"
      justifyContent="flex-start"
      gap={1}
      width="100%"
      height="100%"
    >
      <ReactCodeMirror
        style={{
          width: "100%",
        }}
        width="100%"
        height="30em"
        theme={theme.palette.mode === "dark" ? materialDark : materialLight}
        extensions={json()}
        basicSetup={{
          lineNumbers: true,
        }}
        onChange={onChange}
        onFocus={onFocus}
        value={value}
      />
      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}
    </Stack>
  );
}

JsonInput.propTypes = {
  onFocus: PropTypes.func,
  onChange: PropTypes.func,
  value: PropTypes.string,
  error: PropTypes.string,
};
