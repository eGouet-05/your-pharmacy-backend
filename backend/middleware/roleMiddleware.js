module.exports = function roleMiddleware(allowedRoles = []) {
	return function roleGuard(req, res, next) {
		if (!req.user || !req.user.role) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const normalizedAllowedRoles = allowedRoles.map((role) =>
			String(role).toLowerCase()
		);
		const userRole = String(req.user.role).toLowerCase();

		if (!normalizedAllowedRoles.includes(userRole)) {
			return res.status(403).json({ message: "Forbidden" });
		}

		return next();
	};
};
