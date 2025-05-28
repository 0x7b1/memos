import { extendTheme } from "@mui/joy";

const theme = extendTheme({
  fontFamily: {
    body: '"Inter", sans-serif',
  },
  components: {
    JoyButton: {
      defaultProps: {
        size: "sm",
      },
    },
    JoyInput: {
      defaultProps: {
        size: "sm",
      },
    },
    JoySelect: {
      defaultProps: {
        size: "sm",
      },
      styleOverrides: {
        listbox: {
          zIndex: 9999,
        },
      },
    },
    JoyAutocomplete: {
      styleOverrides: {
        listbox: {
          zIndex: 9999,
        },
      },
    },
  },
});

export default theme;
