const requireTeacher = (req, res, next) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso restrito a professores' });
  }
  next();
};

export default requireTeacher;
