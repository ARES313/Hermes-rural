const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        message: 'Access denied. User not authenticated',
      });
    }

    const userRole = req.user.role_name;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        ok: false,
        message: 'Access denied. Insufficient permissions',
        required_roles: allowedRoles,
        your_role: userRole,
      });
    }

    next();
  };
};

module.exports = authorizeRoles;
