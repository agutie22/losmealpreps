export const CONSULTATION_GOAL_OPTIONS = [
  { value: 'fat_loss', label: 'Fat loss' },
  { value: 'muscle_gain', label: 'Muscle gain' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'performance', label: 'Performance' },
  { value: 'general_health', label: 'General health' },
  { value: 'other', label: 'Other' },
] as const;

export const MACRO_STATUS_OPTIONS = [
  { value: 'unsure', label: 'I am unsure what macros I need' },
  { value: 'rough_numbers', label: 'I have rough numbers' },
  { value: 'exact_targets', label: 'I know my exact targets' },
] as const;

export const REQUEST_TYPE_OPTIONS = [
  { value: 'macro_guidance', label: 'Macro guidance' },
  { value: 'personalized_plan', label: 'Personalized meal plan' },
  { value: 'off_menu_prep', label: 'Off-menu meal prep' },
  { value: 'combination', label: 'A combination of these' },
] as const;

export const BODY_TYPE_OPTIONS = [
  { value: 'unsure', label: 'I am not sure' },
  { value: 'ectomorph', label: 'Naturally lean / hard gainer' },
  { value: 'mesomorph', label: 'Athletic / balanced build' },
  { value: 'endomorph', label: 'Easier weight gain / slower cut' },
  { value: 'other', label: 'Other' },
] as const;

export const ACTIVITY_LEVEL_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light activity' },
  { value: 'moderate', label: 'Moderate activity' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very active' },
] as const;

type OptionLabel = { value: string; label: string };

export type ConsultationFormData = {
  name: string;
  email: string;
  phoneOrInstagram: string;
  goal: string;
  age: string;
  height: string;
  weight: string;
  bodyType: string;
  activityLevel: string;
  dietaryRestrictions: string;
  allergies: string;
  healthConsiderations: string;
  macroStatus: string;
  proteinTarget: string;
  carbsTarget: string;
  fatTarget: string;
  calorieTarget: string;
  requestType: string;
  message: string;
};

export type ConsultationValidationErrors = Partial<Record<keyof ConsultationFormData, string>>;

export type EmailJsConfig = {
  serviceId: string;
  templateId: string;
  publicKey: string;
  missingKeys: string[];
};

export type ConsultationTemplateParams = {
  from_name: string;
  reply_to: string;
  phone_or_instagram: string;
  goal: string;
  macro_status: string;
  request_type: string;
  body_context: string;
  target_macros: string;
  dietary_notes: string;
  message: string;
};

export const defaultConsultationFormData: ConsultationFormData = {
  name: '',
  email: '',
  phoneOrInstagram: '',
  goal: '',
  age: '',
  height: '',
  weight: '',
  bodyType: '',
  activityLevel: '',
  dietaryRestrictions: '',
  allergies: '',
  healthConsiderations: '',
  macroStatus: '',
  proteinTarget: '',
  carbsTarget: '',
  fatTarget: '',
  calorieTarget: '',
  requestType: '',
  message: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function lookupLabel(options: readonly OptionLabel[], value: string) {
  return options.find(option => option.value === value)?.label || value || 'Not provided';
}

function joinProvided(parts: string[]) {
  const provided = parts.filter(Boolean);
  return provided.length > 0 ? provided.join('\n') : 'Not provided';
}

export function getEmailJsConfig(): EmailJsConfig {
  const serviceId = import.meta.env.PUBLIC_EMAILJS_SERVICE_ID || import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
  const templateId = import.meta.env.PUBLIC_EMAILJS_TEMPLATE_ID || import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
  const publicKey = import.meta.env.PUBLIC_EMAILJS_PUBLIC_KEY || import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';
  const missingKeys = [
    ['PUBLIC_EMAILJS_SERVICE_ID', serviceId],
    ['PUBLIC_EMAILJS_TEMPLATE_ID', templateId],
    ['PUBLIC_EMAILJS_PUBLIC_KEY', publicKey],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return { serviceId, templateId, publicKey, missingKeys };
}

export function validateConsultationForm(data: ConsultationFormData) {
  const errors: ConsultationValidationErrors = {};

  if (!data.name.trim()) {
    errors.name = 'Name is required.';
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(data.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (!data.goal) {
    errors.goal = 'Choose a health goal.';
  }

  if (!data.macroStatus) {
    errors.macroStatus = 'Choose your macro comfort level.';
  }

  if (!data.requestType) {
    errors.requestType = 'Choose what kind of help you want.';
  }

  if (!data.message.trim()) {
    errors.message = 'Tell us what you want help with.';
  }

  return errors;
}

export function hasValidationErrors(errors: ConsultationValidationErrors) {
  return Object.keys(errors).length > 0;
}

export function buildConsultationTemplateParams(data: ConsultationFormData): ConsultationTemplateParams {
  const bodyContext = joinProvided([
    data.age.trim() ? `Age: ${data.age.trim()}` : '',
    data.height.trim() ? `Height: ${data.height.trim()}` : '',
    data.weight.trim() ? `Weight: ${data.weight.trim()}` : '',
    data.bodyType ? `Body type: ${lookupLabel(BODY_TYPE_OPTIONS, data.bodyType)}` : '',
    data.activityLevel ? `Activity level: ${lookupLabel(ACTIVITY_LEVEL_OPTIONS, data.activityLevel)}` : '',
  ]);

  const targetMacros = joinProvided([
    data.proteinTarget.trim() ? `Protein: ${data.proteinTarget.trim()}g` : '',
    data.carbsTarget.trim() ? `Carbs: ${data.carbsTarget.trim()}g` : '',
    data.fatTarget.trim() ? `Fat: ${data.fatTarget.trim()}g` : '',
    data.calorieTarget.trim() ? `Calories: ${data.calorieTarget.trim()}` : '',
  ]);

  const dietaryNotes = joinProvided([
    data.dietaryRestrictions.trim() ? `Dietary restrictions: ${data.dietaryRestrictions.trim()}` : '',
    data.allergies.trim() ? `Allergies: ${data.allergies.trim()}` : '',
    data.healthConsiderations.trim() ? `Health considerations: ${data.healthConsiderations.trim()}` : '',
  ]);

  return {
    from_name: data.name.trim(),
    reply_to: data.email.trim(),
    phone_or_instagram: data.phoneOrInstagram.trim() || 'Not provided',
    goal: lookupLabel(CONSULTATION_GOAL_OPTIONS, data.goal),
    macro_status: lookupLabel(MACRO_STATUS_OPTIONS, data.macroStatus),
    request_type: lookupLabel(REQUEST_TYPE_OPTIONS, data.requestType),
    body_context: bodyContext,
    target_macros: targetMacros,
    dietary_notes: dietaryNotes,
    message: data.message.trim(),
  };
}
