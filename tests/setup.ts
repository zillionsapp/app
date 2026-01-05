import { createI18n } from 'vue-i18n'
import { vi } from 'vitest'

// Create i18n instance for tests
export const createTestI18n = () => createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: {
      features_nav: 'Features',
      pricing_nav: 'Pricing',
      login: 'Login',
      get_started: 'Get Started',
      general_preferences: 'General Preferences',
      forgot_title: 'Forgot Password',
      forgot_subtitle: 'Enter your email to reset your password',
      dashboard_overview: 'Dashboard Overview',
      email: 'Email',
      reset_button: 'Send Reset Link',
      reset_message: 'Reset message',
      back_to_login: 'Back to Login',
      stat_total_users: 'Total Users',
      stat_new_registers: 'New Registers',
      server_status: 'Server Status',
      uptime: 'Uptime',
      cpu_usage: 'CPU Usage',
      current_load: 'Current Load',
      memory_usage: 'Memory Usage',
      available: 'Available',
      disk_usage: 'Disk Usage',
      used_space: 'Used Space',
      revenue: 'Revenue',
      user_activity: 'User Activity',
      category_distribution: 'Category Distribution',
      monthly_growth: 'Monthly Growth',
      bubble_chart: 'Bubble Chart',
      project_status: 'Project Status',
      email_notifications: 'Email Notifications',
      email_notifications_desc: 'Receive email notifications',
      marketing_emails: 'Marketing Emails',
      security: 'Security'
    },
    fr: {},
    de: {},
    es: {}
  }
})

// Color mode is disabled in test environment via nuxt.config.ts
