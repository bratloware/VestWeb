import Student from './Student.js';
import Session from './Session.js';
import Banner from './Banner.js';
import Testimonial from './Testimonial.js';
import InstitutionalVideo from './InstitutionalVideo.js';
import Subject from './Subject.js';
import Topic from './Topic.js';
import Question from './Question.js';
import Alternative from './Alternative.js';
import Simulation from './Simulation.js';
import SimulationQuestion from './SimulationQuestion.js';
import QuestionSession from './QuestionSession.js';
import Answer from './Answer.js';
import Video from './Video.js';
import VideoProgress from './VideoProgress.js';
import FavoriteVideo from './FavoriteVideo.js';
import Mentor from './Mentor.js';
import MentoringSession from './MentoringSession.js';
import StudyEvent from './StudyEvent.js';
import Post from './Post.js';
import Comment from './Comment.js';
import Like from './Like.js';
import Report from './Report.js';
import Points from './Points.js';
import Badge from './Badge.js';
import StudentBadge from './StudentBadge.js';
import Streak from './Streak.js';

// Student associations
Student.hasMany(Session, { foreignKey: 'student_id', as: 'sessions' });
Session.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Student.hasMany(Points, { foreignKey: 'student_id', as: 'points' });
Points.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Student.hasOne(Streak, { foreignKey: 'student_id', as: 'streak' });
Streak.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Student.hasMany(StudentBadge, { foreignKey: 'student_id', as: 'studentBadges' });
StudentBadge.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Student.hasMany(StudyEvent, { foreignKey: 'student_id', as: 'studyEvents' });
StudyEvent.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Student.hasMany(FavoriteVideo, { foreignKey: 'student_id', as: 'favoriteVideos' });
FavoriteVideo.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Student.hasMany(VideoProgress, { foreignKey: 'student_id', as: 'videoProgress' });
VideoProgress.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Student.hasMany(Post, { foreignKey: 'student_id', as: 'posts' });
Post.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Student.hasMany(Comment, { foreignKey: 'student_id', as: 'comments' });
Comment.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Student.hasMany(Like, { foreignKey: 'student_id', as: 'likes' });
Like.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Student.hasMany(Answer, { foreignKey: 'student_id', as: 'answers' });

Student.hasMany(QuestionSession, { foreignKey: 'student_id', as: 'questionSessions' });
QuestionSession.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Student.hasMany(MentoringSession, { foreignKey: 'student_id', as: 'mentoringSessions' });
MentoringSession.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

// Mentor
Student.hasOne(Mentor, { foreignKey: 'student_id', as: 'mentorProfile' });
Mentor.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Mentor.hasMany(MentoringSession, { foreignKey: 'mentor_id', as: 'sessions' });
MentoringSession.belongsTo(Mentor, { foreignKey: 'mentor_id', as: 'mentor' });

// Subject / Topic
Subject.hasMany(Topic, { foreignKey: 'subject_id', as: 'topics' });
Topic.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });

// Topic / Question / Video / StudyEvent
Topic.hasMany(Question, { foreignKey: 'topic_id', as: 'questions' });
Question.belongsTo(Topic, { foreignKey: 'topic_id', as: 'topic' });

Topic.hasMany(Video, { foreignKey: 'topic_id', as: 'videos' });
Video.belongsTo(Topic, { foreignKey: 'topic_id', as: 'topic' });

Topic.hasMany(StudyEvent, { foreignKey: 'topic_id', as: 'studyEvents' });
StudyEvent.belongsTo(Topic, { foreignKey: 'topic_id', as: 'topic' });

// Question / Alternative / Answer
Question.hasMany(Alternative, { foreignKey: 'question_id', as: 'alternatives' });
Alternative.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });

Question.hasMany(Answer, { foreignKey: 'question_id', as: 'answers' });
Answer.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });

// Simulation
Simulation.hasMany(SimulationQuestion, { foreignKey: 'simulation_id', as: 'simulationQuestions' });
SimulationQuestion.belongsTo(Simulation, { foreignKey: 'simulation_id', as: 'simulation' });

Simulation.hasMany(QuestionSession, { foreignKey: 'simulation_id', as: 'questionSessions' });
QuestionSession.belongsTo(Simulation, { foreignKey: 'simulation_id', as: 'simulation' });

SimulationQuestion.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });
Question.hasMany(SimulationQuestion, { foreignKey: 'question_id', as: 'simulationQuestions' });

// QuestionSession / Answer
QuestionSession.hasMany(Answer, { foreignKey: 'session_id', as: 'answers' });
Answer.belongsTo(QuestionSession, { foreignKey: 'session_id', as: 'session' });

Answer.belongsTo(Alternative, { foreignKey: 'chosen_alternative_id', as: 'chosenAlternative' });

// Video
Video.belongsTo(Student, { foreignKey: 'created_by', as: 'creator' });
Video.hasMany(VideoProgress, { foreignKey: 'video_id', as: 'progress' });
VideoProgress.belongsTo(Video, { foreignKey: 'video_id', as: 'video' });

Video.hasMany(FavoriteVideo, { foreignKey: 'video_id', as: 'favorites' });
FavoriteVideo.belongsTo(Video, { foreignKey: 'video_id', as: 'video' });

// Post / Comment / Like / Report
Post.hasMany(Comment, { foreignKey: 'post_id', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });

Post.hasMany(Like, { foreignKey: 'post_id', as: 'likes' });
Like.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });

Post.hasMany(Report, { foreignKey: 'post_id', as: 'reports' });
Report.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });
Report.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Comment.hasMany(Comment, { foreignKey: 'parent_id', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parent_id', as: 'parent' });

Like.belongsTo(Comment, { foreignKey: 'comment_id', as: 'comment' });

// Badge
Badge.hasMany(StudentBadge, { foreignKey: 'badge_id', as: 'studentBadges' });
StudentBadge.belongsTo(Badge, { foreignKey: 'badge_id', as: 'badge' });

export {
  Student,
  Session,
  Banner,
  Testimonial,
  InstitutionalVideo,
  Subject,
  Topic,
  Question,
  Alternative,
  Simulation,
  SimulationQuestion,
  QuestionSession,
  Answer,
  Video,
  VideoProgress,
  FavoriteVideo,
  Mentor,
  MentoringSession,
  StudyEvent,
  Post,
  Comment,
  Like,
  Report,
  Points,
  Badge,
  StudentBadge,
  Streak,
};
