// Category slugs, owner wording (system design §2) and ETA priors (§4 stage 8).
export const CATEGORIES = [
  { slug: 'ai_receptionist', label: 'Phone answering', pain: "I miss calls when I'm busy or closed", eta: [0.3, 0.6],
    outcomes: [['fewer_missed_calls', 'No more missed calls'], ['after_hours_answering', 'Calls answered after hours'], ['calls_booked_automatically', 'Callers can book on the phone']] },
  { slug: 'customer_chatbot', label: 'Website chat', pain: 'Customers ask the same questions all day', eta: [0.2, 0.5],
    outcomes: [['instant_answers', 'Instant answers to common questions'], ['fewer_repeat_questions', 'Fewer repeat questions'], ['more_leads_captured', 'More leads from my website']] },
  { slug: 'scheduling', label: 'Booking & scheduling', pain: 'People book, cancel and no-show and I lose hours', eta: [0.4, 0.7],
    outcomes: [['fewer_no_shows', 'Fewer no-shows'], ['online_booking', 'Customers book online themselves'], ['automatic_reminders', 'Reminders go out automatically']] },
  { slug: 'reviews_reputation', label: 'Reviews', pain: 'I need more good reviews and have to answer them', eta: [0.3, 0.6],
    outcomes: [['more_reviews', 'More good reviews'], ['faster_review_replies', 'Reviews answered quickly'], ['better_online_reputation', 'A better online reputation']] },
  { slug: 'social_content', label: 'Social media posts', pain: 'I never know what to post', eta: [0.3, 0.6],
    outcomes: [['consistent_posting', 'Posting regularly without stress'], ['post_ideas', 'Ideas for what to post'], ['scheduled_posts', 'Posts scheduled ahead of time']] },
  { slug: 'email_marketing', label: 'Email & promos', pain: 'My emails and promos take forever', eta: [0.25, 0.5],
    outcomes: [['faster_campaigns', 'Promos written faster'], ['more_repeat_customers', 'More repeat customers'], ['automated_emails', 'Emails that send themselves']] },
  { slug: 'bookkeeping', label: 'Bookkeeping & invoices', pain: 'Bookkeeping and invoices eat my weekends', eta: [0.3, 0.5],
    outcomes: [['faster_invoicing', 'Invoices sent faster'], ['less_bookkeeping_time', 'Less time on the books'], ['faster_payments', 'Getting paid sooner']] },
  { slug: 'field_service', label: 'Jobs & crews', pain: 'I run jobs and crews in the field', eta: [0.15, 0.35],
    outcomes: [['organized_jobs', 'Jobs organized in one place'], ['easier_dispatch', 'Easier crew dispatch'], ['faster_quotes', 'Quotes sent faster']] },
  { slug: 'restaurant_inventory', label: 'Stock & inventory', pain: 'I over-order or run out of stock', eta: [0.15, 0.35],
    outcomes: [['less_waste', 'Less waste'], ['fewer_stockouts', 'Fewer run-outs'], ['easier_ordering', 'Easier ordering']] },
  { slug: 'workforce', label: 'Shifts & staff', pain: 'Shifts, hiring and payroll are a mess', eta: [0.15, 0.3],
    outcomes: [['easier_scheduling', 'Shift schedules in minutes'], ['simpler_payroll', 'Simpler payroll'], ['faster_hiring', 'Hiring made faster']] },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);
export const CATEGORY_BY_SLUG = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));
export const OUTCOME_LIST = CATEGORIES.flatMap((c) => c.outcomes.map(([k]) => k));
export const OUTCOME_LABELS = Object.fromEntries(CATEGORIES.flatMap((c) => c.outcomes));

export const BUSINESS_TYPES = {
  salon: { label: 'Salon or spa', tags: ['salon'] },
  restaurant_cafe: { label: 'Restaurant or café', tags: ['restaurant', 'cafe'] },
  plumber_hvac: { label: 'Plumber or HVAC', tags: ['plumber', 'hvac'] },
  landscaping: { label: 'Landscaping', tags: ['landscaping'] },
  cleaning: { label: 'Cleaning', tags: ['cleaning'] },
  retail: { label: 'Retail shop', tags: ['retail'] },
  online_store: { label: 'Online store', tags: ['ecommerce'] },
  other: { label: 'Other', tags: [] },
};
export const BUSINESS_TAGS = ['salon', 'restaurant', 'cafe', 'plumber', 'hvac', 'landscaping', 'cleaning', 'retail', 'ecommerce', 'health', 'fitness', 'professional_services', 'any'];

export const BUDGET_BANDS = { free_only: 0, under_50: 50, '50_150': 150, '150_500': 500, '500_plus': 1000 };
export const SOFTWARE = ['Square', 'Clover', 'Toast', 'QuickBooks', 'Google Calendar', 'Gmail', 'Shopify', 'Facebook/Instagram', 'Microsoft 365', 'Other'];
export const TEAM_SIZES = ['just_me', '2-9', '10-49'];
export const URGENCY = ['this_week', 'this_month', 'no_rush'];
export const PRIORITIES = ['cost', 'ease', 'speed', 'results'];
