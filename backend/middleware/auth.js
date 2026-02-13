import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        return res.status(500).json({ error: 'JWT_SECRET is not set' });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.sub;
        req.userRole = decoded.role;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

export function requireRole(roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    return function (req, res, next) {
        if (!req.userRole) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.userRole)) {
            return res.status(403).json({ error: 'Insufficient role' });
        }

        next();
    };
}
