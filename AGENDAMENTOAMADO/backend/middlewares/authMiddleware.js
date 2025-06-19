import jwt from 'jsonwebtoken'

export function authenticateToken(req, res, next) {
  // LOG: Mostra headers e início do middleware
  console.log('AuthMiddleware: headers recebidos:', req.headers);
  // O token geralmente vem no header Authorization: Bearer <token>
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    console.log('AuthMiddleware: Token não fornecido');
    return res.status(401).json({ error: 'Token não fornecido' })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('AuthMiddleware: Token inválido');
      return res.status(403).json({ error: 'Token inválido' })
    }

    // Coloca os dados do usuário na requisição para usar nas rotas
    req.user = user
    next()
  })
}
