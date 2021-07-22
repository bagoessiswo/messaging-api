module.exports = {
  secret: process.env.JWT_SECRET_KEY,
  issuer: 'developer@iwata.id',
  audience: 'https://api.iwata.id',
  expiresIn: 31556952
}
