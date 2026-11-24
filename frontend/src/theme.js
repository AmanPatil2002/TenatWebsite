import { createTheme } from "@mui/material/styles";

// Client-side theme: Blue shades, tones, and light colors
// Designed for a professional, trustworthy, and modern feel

const clientTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0284c7",       // Sky Blue 600 - Primary brand color
      light: "#38bdf8",      // Sky Blue 400
      dark: "#0369a1",       // Sky Blue 700
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#0f766e",       // Teal 700 - Secondary accent
      light: "#14b8a6",      // Teal 500
      dark: "#115e59",       // Teal 800
      contrastText: "#ffffff",
    },
    tertiary: {
      main: "#6366f1",       // Indigo 500 - Tertiary accent
      light: "#818cf8",      // Indigo 400
      dark: "#4f46e5",       // Indigo 600
      contrastText: "#ffffff",
    },
    background: {
      default: "#f8fafc",    // Slate 50 - Page background
      paper: "#ffffff",      // White - Card/paper background
      subtle: "#f1f5f9",     // Slate 100 - Subtle backgrounds
      gradient: "linear-gradient(160deg, #f8fafc 0%, #eef2ff 45%, #f0fdfa 100%)",
    },
    text: {
      primary: "#0f172a",    // Slate 900 - Main text
      secondary: "#475569",  // Slate 600 - Secondary text
      muted: "#64748b",      // Slate 500 - Muted text
      inverse: "#ffffff",    // White - For dark backgrounds
    },
    divider: "rgba(15, 23, 42, 0.08)",
    success: {
      main: "#16a34a",       // Green 600
      light: "#4ade80",      // Green 400
      dark: "#15803d",       // Green 700
    },
    warning: {
      main: "#d97706",       // Amber 600
      light: "#fbbf24",      // Amber 400
      dark: "#b45309",       // Amber 700
    },
    error: {
      main: "#dc2626",       // Red 600
      light: "#f87171",      // Red 400
      dark: "#b91c1c",       // Red 700
    },
    info: {
      main: "#0284c7",       // Sky Blue 600
      light: "#38bdf8",      // Sky Blue 400
      dark: "#0369a1",       // Sky Blue 700
    },
    // Custom tonal palette for easy access
    tonal: {
      50: "#f0f9ff",   // Sky 50
      100: "#e0f2fe",  // Sky 100
      200: "#bae6fd",  // Sky 200
      300: "#7dd3fc",  // Sky 300
      400: "#38bdf8",  // Sky 400
      500: "#0ea5e9",  // Sky 500
      600: "#0284c7",  // Sky 600 (primary)
      700: "#0369a1",  // Sky 700
      800: "#075985",  // Sky 800
      900: "#0c4a6e",  // Sky 900
      950: "#082f49",  // Sky 950
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    htmlFontSize: 16,
    h1: {
      fontWeight: 800,
      fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
      lineHeight: 1.15,
      letterSpacing: "-0.03em",
      color: "#0f172a",
    },
    h2: {
      fontWeight: 800,
      fontSize: "clamp(1.875rem, 4vw, 2.75rem)",
      lineHeight: 1.2,
      letterSpacing: "-0.02em",
      color: "#0f172a",
    },
    h3: {
      fontWeight: 800,
      fontSize: "clamp(1.625rem, 3vw, 2.25rem)",
      lineHeight: 1.25,
      letterSpacing: "-0.02em",
      color: "#0f172a",
    },
    h4: {
      fontWeight: 700,
      fontSize: "1.75rem",
      lineHeight: 1.3,
      letterSpacing: "-0.01em",
      color: "#0f172a",
    },
    h5: {
      fontWeight: 700,
      fontSize: "1.5rem",
      lineHeight: 1.35,
      color: "#0f172a",
    },
    h6: {
      fontWeight: 700,
      fontSize: "1.25rem",
      lineHeight: 1.4,
      color: "#0f172a",
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: "1.125rem",
      lineHeight: 1.6,
      color: "#334155",
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: "1rem",
      lineHeight: 1.6,
      color: "#475569",
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.7,
      color: "#334155",
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.6,
      color: "#475569",
    },
    caption: {
      fontSize: "0.75rem",
      lineHeight: 1.5,
      color: "#64748b",
    },
    overline: {
      fontWeight: 700,
      fontSize: "0.7rem",
      lineHeight: 1.6,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "#0284c7",
    },
    button: {
      fontWeight: 600,
      textTransform: "none",
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    "none",
    "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
    "0 4px 8px rgba(15,23,42,0.07), 0 2px 4px rgba(15,23,42,0.05)",
    "0 8px 16px rgba(15,23,42,0.08), 0 4px 8px rgba(15,23,42,0.06)",
    "0 12px 24px rgba(15,23,42,0.09), 0 6px 12px rgba(15,23,42,0.07)",
    "0 16px 32px rgba(15,23,42,0.1), 0 8px 16px rgba(15,23,42,0.08)",
    "0 20px 40px rgba(15,23,42,0.1), 0 10px 20px rgba(15,23,42,0.08)",
    "0 24px 48px rgba(15,23,42,0.12), 0 12px 24px rgba(15,23,42,0.09)",
    "0 28px 56px rgba(15,23,42,0.12), 0 14px 28px rgba(15,23,42,0.09)",
    "0 32px 64px rgba(15,23,42,0.12), 0 16px 32px rgba(15,23,42,0.1)",
    "0 36px 72px rgba(15,23,42,0.12), 0 18px 36px rgba(15,23,42,0.1)",
    "0 40px 80px rgba(15,23,42,0.12), 0 20px 40px rgba(15,23,42,0.1)",
    "0 44px 88px rgba(15,23,42,0.12), 0 22px 44px rgba(15,23,42,0.1)",
    "0 48px 96px rgba(15,23,42,0.12), 0 24px 48px rgba(15,23,42,0.1)",
    "0 52px 104px rgba(15,23,42,0.12), 0 26px 52px rgba(15,23,42,0.1)",
    "0 56px 112px rgba(15,23,42,0.12), 0 28px 56px rgba(15,23,42,0.1)",
    "0 60px 120px rgba(15,23,42,0.12), 0 30px 60px rgba(15,23,42,0.1)",
    "0 64px 128px rgba(15,23,42,0.12), 0 32px 64px rgba(15,23,42,0.1)",
    "0 68px 136px rgba(15,23,42,0.12), 0 34px 68px rgba(15,23,42,0.1)",
    "0 72px 144px rgba(15,23,42,0.12), 0 36px 72px rgba(15,23,42,0.1)",
    "0 76px 152px rgba(15,23,42,0.12), 0 38px 76px rgba(15,23,42,0.1)",
    "0 80px 160px rgba(15,23,42,0.12), 0 40px 80px rgba(15,23,42,0.1)",
    "0 84px 168px rgba(15,23,42,0.12), 0 42px 84px rgba(15,23,42,0.1)",
    "0 88px 176px rgba(15,23,42,0.12), 0 44px 88px rgba(15,23,42,0.1)",
    "0 92px 184px rgba(15,23,42,0.12), 0 46px 92px rgba(15,23,42,0.1)",
    "0 96px 192px rgba(15,23,42,0.12), 0 48px 96px rgba(15,23,42,0.1)",
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "*": {
          boxSizing: "border-box",
        },
        html: {
          scrollBehavior: "smooth",
          scrollPaddingTop: "5rem",
        },
        body: {
          backgroundColor: "#f8fafc",
          color: "#334155",
          overflowX: "hidden",
        },
        "h1, h2, h3, h4, h5, h6": {
          textWrap: "balance",
        },
        "p, li": {
          textWrap: "pretty",
        },
        "*:focus-visible": {
          outline: "3px solid rgba(2, 132, 199, 0.55)",
          outlineOffset: 3,
        },
        "@media (prefers-reduced-motion: reduce)": {
          "*, *::before, *::after": {
            animationDuration: "0.01ms !important",
            animationIterationCount: "1 !important",
            transitionDuration: "0.01ms !important",
            scrollBehavior: "auto !important",
          },
        },
        "::selection": {
          backgroundColor: "rgba(2, 132, 199, 0.2)",
          color: "#0c4a6e",
        },
        "::-webkit-scrollbar": {
          width: 8,
          height: 8,
        },
        "::-webkit-scrollbar-track": {
          background: "#f1f5f9",
        },
        "::-webkit-scrollbar-thumb": {
          background: "#bae6fd",
          borderRadius: 4,
          "&:hover": {
            background: "#7dd3fc",
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        size: "medium",
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          minHeight: 44,
          padding: "10px 20px",
          transition: "background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease, transform 0.2s ease",
          "&:focus-visible": {
            outline: "3px solid rgba(2, 132, 199, 0.4)",
            outlineOffset: 2,
          },
          "&:hover": {
            transform: "translateY(-1px)",
          },
        },
        contained: {
          boxShadow: "0 4px 14px rgba(2, 132, 199, 0.25)",
          "&:hover": {
            boxShadow: "0 6px 20px rgba(2, 132, 199, 0.35)",
          },
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
          "&:hover": {
            background: "linear-gradient(135deg, #0369a1 0%, #075985 100%)",
          },
        },
        containedSecondary: {
          background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)",
          "&:hover": {
            background: "linear-gradient(135deg, #115e59 0%, #0d4a46 100%)",
          },
        },
        outlined: {
          borderWidth: 2,
          "&:hover": {
            borderWidth: 2,
          },
        },
        outlinedPrimary: {
          borderColor: "#0284c7",
          color: "#0284c7",
          "&:hover": {
            backgroundColor: "rgba(2, 132, 199, 0.06)",
            borderColor: "#0369a1",
            color: "#0369a1",
          },
        },
        textPrimary: {
          color: "#0284c7",
          "&:hover": {
            backgroundColor: "rgba(2, 132, 199, 0.06)",
          },
        },
        sizeSmall: {
          padding: "6px 14px",
          fontSize: "0.8125rem",
        },
        sizeLarge: {
          padding: "14px 28px",
          fontSize: "1.0625rem",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
          transition: "background-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease, transform 0.2s ease",
          "&:focus-visible": {
            outline: "3px solid rgba(2, 132, 199, 0.4)",
            outlineOffset: 2,
          },
        },
        sizeSmall: {
          minWidth: 40,
          minHeight: 40,
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: "1px solid rgba(15, 23, 42, 0.06)",
          backgroundColor: "#ffffff",
          transition: "box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease",
          "&:hover": {
            boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
            transform: "translateY(-2px)",
            borderColor: "rgba(2, 132, 199, 0.15)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        elevation0: {
          boxShadow: "none",
          border: "1px solid rgba(15, 23, 42, 0.06)",
        },
        elevation1: {
          boxShadow: "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "medium",
        variant: "outlined",
      },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
            backgroundColor: "#ffffff",
            transition: "box-shadow 0.2s ease, border-color 0.2s ease",
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#7dd3fc",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#0284c7",
              borderWidth: 2,
            },
          },
          "& .MuiInputLabel-root": {
            color: "#64748b",
            fontWeight: 500,
            "&.Mui-focused": {
              color: "#0284c7",
            },
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: "0.9375rem",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
        sizeSmall: {
          height: 24,
          fontSize: "0.7rem",
        },
        sizeMedium: {
          height: 28,
          fontSize: "0.75rem",
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 700,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: "1px solid rgba(15, 23, 42, 0.06)",
          backgroundColor: "#ffffff",
          boxShadow: "none",
          "&:before": { display: "none" },
          "&.Mui-expanded": {
            margin: 0,
            borderColor: "rgba(2, 132, 199, 0.2)",
            boxShadow: "0 8px 24px rgba(2, 132, 199, 0.1)",
            backgroundColor: "rgba(2, 132, 199, 0.02)",
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "16px 20px",
          "&.Mui-expanded": {
            minHeight: 48,
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: "0 20px 20px",
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 48,
        },
        indicator: {
          height: 3,
          borderRadius: "3px 3px 0 0",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.9375rem",
          minHeight: 48,
          color: "#475569",
          opacity: 0.7,
          "&:hover": {
            opacity: 1,
            backgroundColor: "rgba(2, 132, 199, 0.04)",
          },
          "&.Mui-selected": {
            color: "#0284c7",
            opacity: 1,
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          maxWidth: "100%",
          overflowX: "auto",
          overscrollBehaviorInline: "contain",
          WebkitOverflowScrolling: "touch",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontVariantNumeric: "tabular-nums",
          fontWeight: 700,
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "#64748b",
          backgroundColor: "#f8fafc",
          borderBottom: "2px solid rgba(15, 23, 42, 0.06)",
        },
        body: {
          fontSize: "0.875rem",
          color: "#334155",
          borderBottom: "1px solid rgba(15, 23, 42, 0.04)",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-child .MuiTableCell-body": {
            borderBottom: "none",
          },
          "&:hover": {
            backgroundColor: "rgba(2, 132, 199, 0.02)",
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: "none",
        },
        standardSuccess: {
          backgroundColor: "rgba(22, 163, 74, 0.08)",
          color: "#15803d",
        },
        standardError: {
          backgroundColor: "rgba(220, 38, 38, 0.08)",
          color: "#b91c1c",
        },
        standardWarning: {
          backgroundColor: "rgba(217, 119, 6, 0.08)",
          color: "#b45309",
        },
        standardInfo: {
          backgroundColor: "rgba(2, 132, 199, 0.08)",
          color: "#0369a1",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          maxHeight: "min(90vh, 900px)",
          borderRadius: 20,
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.2)",
          overscrollBehavior: "contain",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: "1.25rem",
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: "1px solid rgba(15, 23, 42, 0.06)",
          boxShadow: "0 16px 40px rgba(15, 23, 42, 0.12)",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          "&:hover": {
            backgroundColor: "rgba(2, 132, 199, 0.06)",
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(2, 132, 199, 0.1)",
            color: "#0284c7",
            "&:hover": {
              backgroundColor: "rgba(2, 132, 199, 0.14)",
            },
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          backgroundColor: "#0f172a",
          fontSize: "0.75rem",
          padding: "8px 12px",
        },
        arrow: {
          color: "#0f172a",
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 6,
          backgroundColor: "#e0f2fe",
        },
        bar: {
          borderRadius: 4,
          background: "linear-gradient(90deg, #0284c7 0%, #0ea5e9 100%)",
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: "#0284c7",
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: "#e0f2fe",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(15, 23, 42, 0.06)",
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: "#0284c7",
          fontWeight: 500,
          "&:hover": {
            color: "#0369a1",
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: "2px 8px",
          "&:hover": {
            backgroundColor: "rgba(2, 132, 199, 0.06)",
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(2, 132, 199, 0.1)",
            color: "#0284c7",
            "&:hover": {
              backgroundColor: "rgba(2, 132, 199, 0.14)",
            },
            "& .MuiListItemIcon-root": {
              color: "#0284c7",
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: "#64748b",
          minWidth: 40,
        },
      },
    },
    MuiRating: {
      styleOverrides: {
        root: {
          "& .MuiRating-iconFilled": {
            color: "#0ea5e9",
          },
          "& .MuiRating-iconHover": {
            color: "#38bdf8",
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 10,
          borderColor: "rgba(15, 23, 42, 0.12)",
          "&:hover": {
            backgroundColor: "rgba(2, 132, 199, 0.04)",
            borderColor: "#0284c7",
          },
          "&.Mui-selected": {
            backgroundColor: "#0284c7",
            color: "#ffffff",
            borderColor: "#0284c7",
            "&:hover": {
              backgroundColor: "#0369a1",
              borderColor: "#0369a1",
            },
          },
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          padding: 0,
        },
      },
    },
    MuiStepConnector: {
      styleOverrides: {
        line: {
          borderColor: "rgba(15, 23, 42, 0.12)",
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          "&.Mui-active": {
            color: "#0284c7",
          },
          "&.Mui-completed": {
            color: "#16a34a",
          },
        },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          borderColor: "rgba(15, 23, 42, 0.12)",
          "&:hover": {
            backgroundColor: "rgba(2, 132, 199, 0.06)",
            borderColor: "#0284c7",
          },
          "&.Mui-selected": {
            backgroundColor: "#0284c7",
            color: "#ffffff",
            borderColor: "#0284c7",
            "&:hover": {
              backgroundColor: "#0369a1",
            },
          },
        },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        root: {
          fontSize: "0.875rem",
        },
        li: {
          color: "#64748b",
        },
        separator: {
          color: "#94a3b8",
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(15, 23, 42, 0.5)",
          backdropFilter: "blur(4px)",
        },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: "#0f172a",
          color: "#ffffff",
        },
      },
    },
  },
  // Custom spacing and z-index tokens
  custom: {
    headerHeight: 64,
    footerHeight: 300,
    sidebarWidth: 280,
    maxContentWidth: 1200,
    transitionDuration: "0.2s",
    transitionEasing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
});

export default clientTheme;