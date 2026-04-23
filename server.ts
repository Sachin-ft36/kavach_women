import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = Number(process.env.PORT) || 3001;

  app.use(express.json());

  // ── USER REGISTRY ───────────────────────────────────────────────────────
  const userSocketMap  = new Map<string, string>();  // uid → socket.id
  const socketRoleMap  = new Map<string, string>();  // socket.id → 'citizen'|'protector'
  const anonymousRooms = new Map<string, string>();  // roomId → victim socket.id

  io.on("connection", (socket) => {
    console.log("KAVACH Signal: Node Attached:", socket.id);

    // ── Identity Registration ──────────────────────────────────────────────
    socket.on("join", ({ userId, role }: { userId: string; role: string }) => {
      userSocketMap.set(userId, socket.id);
      socketRoleMap.set(socket.id, role || "citizen");
      socket.join(`role:${role}`); // join role room for broadcasts
      console.log(`KAVACH: ${role} ${userId} anchored → ${socket.id}`);
    });

    // ── Standard WebRTC Signaling (Named) ─────────────────────────────────
    socket.on("call-user", ({ to, offer, from, fromName }) => {
      const target = userSocketMap.get(to);
      if (target) {
        io.to(target).emit("incoming-call", { from, offer, fromName });
      } else {
        socket.emit("call-failed", { reason: "User offline" });
      }
    });

    socket.on("make-answer", ({ to, answer }) => {
      const target = userSocketMap.get(to);
      if (target) io.to(target).emit("call-answered", { answer });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      const target = userSocketMap.get(to);
      if (target) io.to(target).emit("ice-candidate", { candidate });
    });

    socket.on("hangup", ({ to }) => {
      const target = userSocketMap.get(to);
      if (target) io.to(target).emit("call-ended");
    });

    // ── Anonymous SOS Call Room ───────────────────────────────────────────
    // Victim creates room → gets anonymous room ID → shares to protector
    socket.on("sos-create-room", () => {
      const roomId = Math.random().toString(36).slice(2, 10).toUpperCase();
      anonymousRooms.set(roomId, socket.id);
      socket.join(`sos:${roomId}`);
      socket.emit("sos-room-created", { roomId });
      console.log(`KAVACH ANON: Room ${roomId} created by victim.`);

      // Broadcast SOS alert to ALL protectors online
      socket.to("role:protector").emit("sos-alert-broadcast", {
        roomId,
        timestamp: Date.now(),
        message: "⚠️ VICTIM IN DISTRESS — Anonymous SOS Room Active"
      });
    });

    socket.on("sos-join-room", ({ roomId, offer }) => {
      const victimSocket = anonymousRooms.get(roomId);
      if (!victimSocket) { socket.emit("call-failed", { reason: "Room not found or expired" }); return; }
      socket.join(`sos:${roomId}`);
      // Forward WebRTC offer to victim (identity masked — no names exchanged)
      io.to(victimSocket).emit("incoming-call", {
        from: roomId,         // Only room ID, never protector's real ID
        fromName: "Anonymous Protector",
        offer
      });
      console.log(`KAVACH ANON: Protector joined room ${roomId}`);
    });

    socket.on("sos-answer", ({ roomId, answer }) => {
      socket.to(`sos:${roomId}`).emit("call-answered", { answer });
    });

    socket.on("sos-ice", ({ roomId, candidate }) => {
      socket.to(`sos:${roomId}`).emit("ice-candidate", { candidate });
    });

    socket.on("sos-hangup-room", ({ roomId }) => {
      socket.to(`sos:${roomId}`).emit("call-ended");
      anonymousRooms.delete(roomId);
    });

    // ── Disconnect Cleanup ────────────────────────────────────────────────
    socket.on("disconnect", () => {
      for (const [uid, sid] of userSocketMap.entries()) {
        if (sid === socket.id) { userSocketMap.delete(uid); break; }
      }
      for (const [room, sid] of anonymousRooms.entries()) {
        if (sid === socket.id) {
          anonymousRooms.delete(room);
          io.to(`sos:${room}`).emit("call-ended");
        }
      }
      socketRoleMap.delete(socket.id);
    });
  });


  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", signaling: "active" });
  });

  // Mock Zero-FIR PDF Generation
  app.post("/api/generate-fir", (req, res) => {
    const { victimName, location, timestamp } = req.body;
    res.json({ 
      success: true, 
      firId: `FIR-${Date.now()}`,
      pdfUrl: "https://example.com/mock-fir.pdf" 
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`KAVACH Secure Server running on http://localhost:${PORT}`);
  });
}

startServer();
