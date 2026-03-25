import { Banner, Testimonial, InstitutionalVideo, Student } from '../db/models/index.js';

export const getBanners = async (req, res) => {
  try {
    const banners = await Banner.findAll({
      where: { active: true },
      order: [['order', 'ASC']],
    });
    return res.json({ message: 'Banners fetched', data: banners });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.findAll({
      where: { active: true },
      order: [['created_at', 'DESC']],
    });
    return res.json({ message: 'Testimonials fetched', data: testimonials });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getInstitutionalVideo = async (req, res) => {
  try {
    const video = await InstitutionalVideo.findOne({ order: [['updated_at', 'DESC']] });
    return res.json({ message: 'Video fetched', data: video });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getCollaborators = async (req, res) => {
  try {
    const collaborators = await Student.findAll({
      where: { role: 'teacher' },
      attributes: ['id', 'name', 'avatar_url', 'email'],
    });
    return res.json({ message: 'Collaborators fetched', data: collaborators });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const submitContact = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'name, email and message are required' });
    }
    // In a real system, you'd send an email or save to DB
    console.log('Contact form submission:', { name, email, message });
    return res.json({ message: 'Mensagem recebida com sucesso! Entraremos em contato em breve.' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
