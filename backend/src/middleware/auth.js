import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido" });
  }
  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.usuario = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

export function adminOnly(req, res, next) {
  if (req.usuario.perfil !== "admin") {
    return res.status(403).json({ error: "Acesso restrito ao administrador" });
  }
  next();
}
