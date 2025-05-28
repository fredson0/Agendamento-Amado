// middlewares/adminMiddleware.js

export function checkAdmin(req, res, next) {
  // Verifica se o usuário está autenticado
  if (!req.user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  // Verifica se o usuário tem a role de administrador
  // Aqui consideramos que o campo `role` é usado no JWT, e que 'admin' representa administrador
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado: apenas administradores podem realizar essa ação' });
  }

  // Se tudo estiver certo, continua para a próxima função
  next();
}
