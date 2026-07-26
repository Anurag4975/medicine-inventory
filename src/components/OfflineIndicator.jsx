// src/components/OfflineIndicator.jsx
import React, { useState, useEffect } from "react";
import { Box, Chip, Tooltip } from "@mui/material";
import { WifiOff, CloudOff, Storage } from "@mui/icons-material";
import { appCache } from "../utils/appCache";

const OfflineIndicator = () => {
  const [status, setStatus] = useState({
    isOnline: navigator.onLine,
    isNearLimit: false,
    readCount: 0,
    queueStatus: { pending: 0 },
  });

  useEffect(() => {
    // Update status every 5 seconds
    const interval = setInterval(() => {
      setStatus(appCache.getStatus());
    }, 5000);

    // Also update on online/offline events
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
    };
    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial status
    setStatus(appCache.getStatus());

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Don't show anything if everything is fine
  if (
    status.isOnline &&
    !status.isNearLimit &&
    status.queueStatus.pending === 0
  ) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", ml: 1 }}>
      {/* Offline Indicator */}
      {!status.isOnline && (
        <Tooltip
          title="You are offline. Changes will be saved locally and sync when connection is restored."
          arrow
        >
          <Chip
            icon={<WifiOff sx={{ fontSize: 14 }} />}
            label="Offline"
            size="small"
            color="warning"
            variant="filled"
            sx={{
              height: 24,
              fontSize: "0.7rem",
              fontWeight: 600,
              animation: "pulse 2s infinite",
              "@keyframes pulse": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.6 },
              },
            }}
          />
        </Tooltip>
      )}

      {/* Near Read Limit Indicator */}
      {status.isNearLimit && (
        <Tooltip
          title={`Firestore reads today: ${status.readCount.toLocaleString()}. Using cached data to stay within limits.`}
          arrow
        >
          <Chip
            icon={<CloudOff sx={{ fontSize: 14 }} />}
            label="Cache Mode"
            size="small"
            color="info"
            variant="filled"
            sx={{
              height: 24,
              fontSize: "0.7rem",
              fontWeight: 600,
            }}
          />
        </Tooltip>
      )}

      {/* Pending Operations Indicator */}
      {status.queueStatus.pending > 0 && (
        <Tooltip
          title={`${status.queueStatus.pending} operation(s) waiting to sync. Will process automatically when online.`}
          arrow
        >
          <Chip
            icon={<Storage sx={{ fontSize: 14 }} />}
            label={`${status.queueStatus.pending} pending`}
            size="small"
            color="error"
            variant="filled"
            sx={{
              height: 24,
              fontSize: "0.7rem",
              fontWeight: 600,
            }}
          />
        </Tooltip>
      )}
    </Box>
  );
};

export default OfflineIndicator;
