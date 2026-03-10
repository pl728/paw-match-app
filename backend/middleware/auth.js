import jwt from 'jsonwebtoken';

/**
 * Authentication middleware that verifies JWT tokens.
 *
 * This middleware:
 * - Extracts the JWT token from the Authorization header (Bearer token format)
 * - Verifies the token using the JWT_SECRET environment variable
 * - Attaches userId and userRole to the request object for use in route handlers
 *
 * Usage: Add this middleware to any route that requires authentication
 * Example: router.get('/protected', requireAuth, asyncHandler(async (req, res) => {...}))
 *
 * The token should be included in requests as:
 * Authorization: Bearer <token>
 *
 * On success, adds to request object:
 * - req.userId: The user's ID (from token's 'sub' claim)
 * - req.userRole: The user's role (e.g., 'adopter' or 'shelter_admin')
 */
export function requireAuth(req, res, next) {
    // Extract the Authorization header from the request
    const authHeader = req.headers.authorization;

    // Check if the header exists and follows the "Bearer <token>" format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    // Extract the token (skip "Bearer " prefix which is 7 characters)
    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    // Ensure JWT_SECRET is configured in environment variables
    if (!jwtSecret) {
        return res.status(500).json({ error: 'JWT_SECRET is not set' });
    }

    try {
        // Verify and decode the JWT token
        const decoded = jwt.verify(token, jwtSecret);

        // Attach user information to the request object for use in route handlers
        // 'sub' (subject) claim contains the user ID
        req.userId = decoded.sub;
        req.userRole = decoded.role;

        // Continue to the next middleware/route handler
        next();
    } catch (err) {
        // Token is invalid, expired, or malformed
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
