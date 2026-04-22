const requireTeacher = (req, res, next) => {
  const role = req.user?.role;
  const type = req.user?.type;
  const allowed = type === 'teacher' || role === 'teacher' || role === 'admin';
  if (!allowed) {
    return res.status(403).json({ message: 'Acesso restrito a professores' });
  }
  next();
};

export default requireTeacher;
