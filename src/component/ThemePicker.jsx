import { useTheme } from "@emotion/react";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { IconButton, useColorScheme } from "@mui/material";

export default function ThemePicker() {
  const theme = useTheme();
  const { setMode } = useColorScheme();

  const handleOnChange = () => {
    setMode(theme.palette.mode === "dark" ? "light" : "dark");
  };

  return (
    <IconButton
      onClick={handleOnChange}
      sx={{ position: "absolute", right: 0, top: 0 }}
    >
      {theme.palette.mode === "dark" ? <DarkModeIcon /> : <LightModeIcon />}
    </IconButton>
  );
}
