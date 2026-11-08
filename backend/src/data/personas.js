// Three sample businesses for the public demo (clearly labelled as sample data in the UI).
export const PERSONAS = [
  { slug: 'salon', label: 'Maple & Co. Hair Studio (sample salon)', answers: {
    business_type: 'salon', team_size_band: '2-9', needs: ['scheduling', 'ai_receptionist'], something_else: false,
    hours: { scheduling: 5, ai_receptionist: 3 }, outcomes: ['fewer_no_shows', 'online_booking', 'fewer_missed_calls'],
    budget: '50_150', software: ['Square', 'Google Calendar'], tech_comfort: 2, urgency: 'this_week', priority: 'ease',
    free_text: 'We lose bookings when we are with clients and cannot answer the phone.' } },
  { slug: 'restaurant', label: 'Corner Table Café (sample restaurant)', answers: {
    business_type: 'restaurant_cafe', team_size_band: '10-49', needs: ['restaurant_inventory', 'reviews_reputation'], something_else: false,
    hours: { restaurant_inventory: 6, reviews_reputation: 3 }, outcomes: ['less_waste', 'fewer_stockouts', 'more_reviews', 'faster_review_replies'],
    budget: '150_500', software: ['Toast', 'QuickBooks', 'Facebook/Instagram'], tech_comfort: 3, urgency: 'this_month', priority: 'results',
    free_text: '' } },
  { slug: 'plumber', label: 'Rivera Plumbing & Heating (sample plumber)', answers: {
    business_type: 'plumber_hvac', team_size_band: '2-9', needs: ['field_service', 'bookkeeping'], something_else: false,
    hours: { field_service: 8, bookkeeping: 4 }, outcomes: ['organized_jobs', 'faster_quotes', 'faster_invoicing'],
    budget: '50_150', software: ['QuickBooks', 'Gmail'], tech_comfort: 3, urgency: 'this_month', priority: 'cost',
    free_text: '' } },
];
