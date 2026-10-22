import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  Skeleton,
  Stack,
} from "@mui/material";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const authFetch = async (path, signal) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "Failed to load dashboard");
  return data;
};

export default function AdminDashboard() {
  const username = localStorage.getItem("username");

  const [user, setUser] = useState([]);
  const [review, setReview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

const load = async (signal) => {
  setLoading(true);
  setError("");
  try {
    const userData = await authFetch("/auth/register", signal);
    const reviewData = await authFetch("/review/getreview", signal);

    if (signal?.aborted) return;
    setUser(Array.isArray(userData) ? userData : []);
    setReview(Array.isArray(reviewData) ? reviewData : []);
  } catch (err) {
    if (err.name === "AbortError") return;
    setError(err.message);
    setUser([]);
    setReview([]);
  } finally {
    if (!signal?.aborted) setLoading(false);
  }
};

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, []);


  const stats = [
    { title: "Total User Active", value: user.filter((account) => account.status === "active").length },
    { title: "Total Review", value: review.length },
  ];

  return (
    <Box>
      <Typography
        variant="h4"
        fontWeight="bold"
        gutterBottom
        sx={{
          fontSize: { xs: "1.5rem", sm: "2.125rem" },
          overflowWrap: "anywhere",
        }}
      >
        Welcome back, {username}!
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => load()}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {(loading ? Array.from({ length: 6 }) : stats).map((stat, i) => (
          <Grid
            key={stat?.title ?? i}
            size={{ xs: 12, sm: 6, lg: 4 }}
            sx={{ display: "flex" }}
          >
            <Card
              sx={{
                width: "100%",
                minHeight: { xs: 110, sm: 150 },
                borderRadius: 3,
                boxShadow: 2,
              }}
            >
              <CardContent
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  textAlign: "center",
                  justifyContent: "center",
                }}
              >
                {loading ? (
                  <Stack sx={{ width: "100%" }}>
                    <Skeleton width="60%" />
                    <Skeleton variant="text" width="30%" height={48} />
                  </Stack>
                ) : (
                  <Stack>
                    <Typography
                      variant="h5"
                      color="text.secondary"
                      sx={{ textAlign: "center", ...(stat.sx || {}) }}
                    >
                      {stat.title}
                    </Typography>
                    <Typography
                      variant="h4"
                      fontWeight="bold"
                      sx={{ mt: 1, ...(stat.sx || {}) }}
                    >
                      {error ? "-" : stat.value}
                    </Typography>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}