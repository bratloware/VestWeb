import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  customer_email: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  customer_name: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  stripe_customer_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  stripe_subscription_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
  },
  stripe_session_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  plan_type: {
    type: DataTypes.ENUM('individual', 'empresa'),
    allowNull: false,
  },
  plan_tier: {
    // individual | Starter | Básico | Profissional | Enterprise
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'individual',
  },
  billing_period: {
    type: DataTypes.ENUM('mensal', 'trimestral', 'anual'),
    allowNull: false,
  },
  status: {
    // active | trialing | past_due | canceled | incomplete
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'incomplete',
  },
  student_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
  },
  company_name: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  current_period_end: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'subscriptions',
  timestamps: false,
});

export default Subscription;
