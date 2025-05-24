"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Grid2,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import { useParams, useRouter } from "next/navigation";
import CenterLoading from "@/app/(routes)/(public)/components/CenterLoading";

const TransactionDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const theme = useTheme();

  const fetchTransaction = async () => {
    try {
      const response = await fetch(`/api/transaction/online/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch transaction");
      }
      const data = await response.json();
      setOrder(data.data);

      const userResponse = await fetch(`/api/user/${data.data.userId}`);
      if (!userResponse.ok) {
        throw new Error("Failed to fetch user data");
      }
      const userData = await userResponse.json();
      setUser(userData.data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  const handleOpenDialog = (type) => {
    setActionType(type);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setActionType(null);
  };

  const updateOrderStatus = async () => {
    if (!actionType) return;
    const newStatus = actionType === "deliver" ? "progress" : "completed";

    try {
      const response = await fetch(`/api/transaction/online/${order._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to update order status");
      }
      const updatedOrder = await response.json();

      if (newStatus === "completed") {
        router.push("/admin/order");
      } else {
        fetchTransaction();
      }
    } catch (err) {
      console.error("Error updating order status:", err.message);
    } finally {
      handleCloseDialog();
    }
  };

  if (loading) return <CenterLoading />;
  if (error) return <Typography>Error: {error}</Typography>;

  return (
    <Box sx={{ minHeight: "100vh", padding: 4 }}>
      {/* Header Section */}
      <Box mb={4}>
        <Grid2 container alignItems="center" spacing={2}>
          <Grid2 xs={12} sm={6}>
            <IconButton
              onClick={() => router.push("/admin/order")}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: "white",
                borderRadius: "50%",
                boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.1)",
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Grid2>
          <Grid2 xs={12} sm={6}>
            <Typography variant="h4" fontWeight="bold" color="primary">
              Order Details
            </Typography>
          </Grid2>
        </Grid2>
      </Box>

      {/* Order Details */}
      <Card
        elevation={5}
        sx={{ marginBottom: 4, borderRadius: 2, overflow: "hidden" }}
      >
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Order Information
          </Typography>
          <Typography variant="body1">
            <strong>Order ID:</strong> {order.idTransaksi}
          </Typography>
          <Typography variant="body1">
            <strong>Customer Name:</strong> {user?.name || "-"}
          </Typography>
          <Typography variant="body1">
            <strong>Phone Number:</strong> {user?.phone_number || "-"}
          </Typography>
          <Typography variant="body1">
            <strong>Address:</strong> {order.alamat || "-"}
          </Typography>
          <Typography variant="body1">
            <strong>Notes:</strong> {order.notes || "-"}
          </Typography>
          <Typography variant="body1">
            <strong>Total Price:</strong> Rp. {order.total || "-"}
          </Typography>
        </CardContent>
      </Card>

      {/* List of Services */}
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Services and Add-Ons
      </Typography>
      <Grid2 container spacing={2}>
        {order.jasa.map((jasa, index) => (
          <Grid2 xs={12} sm={6} md={4} lg={3} key={index}>
            <Card
              elevation={3}
              sx={{
                borderRadius: 2,
                height: "100%",
                boxShadow: "0px 2px 15px rgba(0, 0, 0, 0.1)",
                position: "relative",
                paddingBottom: "60px", // Added padding bottom to avoid overlap with button
              }}
            >
              <CardContent>
                <Typography variant="h6" fontWeight="bold">
                  {jasa.nama}
                </Typography>
                <Typography variant="body1">
                  Quantity: {jasa.lembar} Sheets | Copies: {jasa.qty} | Price:
                  Rp. {jasa.harga}
                </Typography>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ marginTop: 1 }}
                >
                  Notes: {jasa.notes || "-"}
                </Typography>
                {jasa.addOns.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Add-Ons:
                    </Typography>
                    {jasa.addOns.map((addOn, idx) => (
                      <Typography key={idx} variant="body2">
                        - {addOn.nama} with {addOn.qty}{" "}
                        {addOn.tipeHarga === "lembar" ? "sheet" : "copy"} priced
                        at Rp. {addOn.harga}
                      </Typography>
                    ))}
                  </Box>
                )}
              </CardContent>
              <CardActions sx={{ position: "absolute", bottom: 8, right: 8 }}>
                <Tooltip title="Download File">
                  <IconButton
                    href={jasa.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="primary"
                    sx={{
                      backgroundColor: theme.palette.background.default,
                      borderRadius: "50%",
                    }}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid2>
        ))}
      </Grid2>

      {/* Action Buttons */}
      <Box mt={4} textAlign="center">
        {order.status === "pending" && (
          <Button
            variant="contained"
            color="warning"
            onClick={() => handleOpenDialog("deliver")}
            sx={{
              textTransform: "none",
              fontSize: 18,
              width: { xs: "100%", sm: "80%", md: "60%" },
              height: 50,
              borderRadius: "8px",
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)",
            }}
          >
            Deliver Order
          </Button>
        )}
        {order.status === "progress" && (
          <Button
            variant="contained"
            color="success"
            onClick={() => handleOpenDialog("complete")}
            sx={{
              textTransform: "none",
              fontSize: 18,
              width: { xs: "100%", sm: "80%", md: "60%" },
              height: 50,
              borderRadius: "8px",
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)",
            }}
          >
            Complete Order
          </Button>
        )}
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to{" "}
            {actionType === "deliver"
              ? "deliver this order"
              : "mark this order as completed"}
            ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={updateOrderStatus}
            color="primary"
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionDetailPage;
