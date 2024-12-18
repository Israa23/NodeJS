const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const bodyparser = require("body-parser");
const hotelRoutes = require("./routes/hotel");
const { addRoom } = require("./controller/hotelController");
const config = require("./config/dbconnexion.json");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

mongoose.connect(config.url)
    .then(() => console.log("Base de données connectée"))
    .catch((err) => console.error("Échec de connexion à la base de données:", err));

app.use(express.json());
app.use(bodyparser.json());
app.use("/hotel", hotelRoutes);

io.on("connection", (socket) => {
    console.log("Client connecté via Socket.IO");

    socket.on("addRoom", async (data) => {
        const { hotelId } = data;

        try {
            const hotel = await mongoose.model("Hotel").findById(hotelId);
            if (!hotel) {
                return socket.emit("error", { message: "Hôtel introuvable" });
            }
            hotel.rooms += 1;
            await hotel.save();
            socket.emit("roomAdded", hotel);
        } catch (error) {
            socket.emit("error", { message: "Erreur serveur", error: error.message });
        }
    });

    socket.on("disconnect", () => {
        console.log("Client déconnecté");
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Serveur en écoute sur le port ${PORT}`);
});
