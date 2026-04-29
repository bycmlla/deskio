import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./database.js";
import "./models/index.js";
import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";
import bcrypt from "bcryptjs";
import { UsuarioAdmin } from "./models/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

async function seedAdmin() {
  try {
    const exists = await UsuarioAdmin.findOne({
      where: { email: "admin@helpdesk.com" },
    });
    if (!exists) {
      const hash = await bcrypt.hash("admin123", 10);
      await UsuarioAdmin.create({
        nome: "Administrador",
        email: "admin@helpdesk.com",
        senha_hash: hash,
        perfil: "admin",
        ativo: true,
        data_criacao: new Date(),
      });
      console.log("Admin padrão criado: admin@helpdesk.com / admin123");
    }
  } catch (err) {
    console.error("Erro ao criar admin padrão:", err.message);
  }
}

sequelize
  .sync({ alter: true })
  .then(async () => {
    console.log("Banco de dados sincronizado");
    await seedAdmin();
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch((err) => console.error("Erro ao conectar no banco:", err));
