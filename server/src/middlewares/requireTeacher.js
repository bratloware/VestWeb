const requireTeacher = (req, res, next) => {
  if (req.user?.type !== 'teacher') {
    return res.status(403).json({ message: 'Acesso restrito a professores' });
  }
  next();
};

export default requireTeacher;
