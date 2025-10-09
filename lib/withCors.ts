import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'

export default function withCors(handler: NextApiHandler) {
  return async function (req: NextApiRequest, res: NextApiResponse) {
    const origin = process.env.CORS_ORIGIN || '*'
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Credentials', 'true')

    if (req.method === 'OPTIONS') {
      res.status(204).end()
      return
    }

    return handler(req, res)
  }
}
