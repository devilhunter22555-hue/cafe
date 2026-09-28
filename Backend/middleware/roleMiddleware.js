function normalizeRole(role) {
  if (!role) return '';
  const r = String(role).trim().toLowerCase();
  if (r === 'admin') return 'owner';
  return r;
}

function checkPermission(allowedRoles) {
  const normalizedAllowed = allowedRoles.map(normalizeRole);
  return (req, res, next) => {
    const userRole = normalizeRole(req.user?.role);
    if (!req.user || !normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Forbidden'
      });
    }
    next();
  };
}

module.exports = { checkPermission };
