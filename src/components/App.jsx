import Map from "./Map";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Box } from "@mui/material";

const darkTheme = createTheme({
    palette: {
        mode: "dark",
    },
});

function App() {
    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Box 
                sx={{ 
                    height: "100vh",
                    position: "relative"
                }}
            >
                <Map />
            </Box>
        </ThemeProvider>
    );
}

export default App;