import { useState } from 'react';
import emailjs from '@emailjs/browser';
import {
  ACTIVITY_LEVEL_OPTIONS,
  BODY_TYPE_OPTIONS,
  CONSULTATION_GOAL_OPTIONS,
  MACRO_STATUS_OPTIONS,
  REQUEST_TYPE_OPTIONS,
  buildConsultationTemplateParams,
  defaultConsultationFormData,
  getEmailJsConfig,
  hasValidationErrors,
  validateConsultationForm,
  type ConsultationFormData,
  type ConsultationValidationErrors,
} from '@/lib/consultation';

type FieldName = keyof ConsultationFormData;

type MessageState = {
  text: string;
  error: boolean;
} | null;

const inputCls = 'w-full px-4 py-3 rounded-[var(--radius-input)] border border-[var(--color-surface-sunken)] bg-[var(--color-surface-base)] text-[var(--color-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] transition-shadow';
const labelCls = 'block text-[14px] font-medium text-[var(--color-fg)] mb-2';
const hintCls = 'mt-2 text-[12px] text-[var(--color-fg-subtle)]';
const errorCls = 'mt-2 text-[12px] text-red-600';

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className={errorCls}>{error}</p>;
}

function RequiredMark() {
  return <span className="text-[var(--color-brand)]" aria-hidden="true">*</span>;
}

export default function ConsultationForm() {
  const [form, setForm] = useState<ConsultationFormData>(defaultConsultationFormData);
  const [errors, setErrors] = useState<ConsultationValidationErrors>({});
  const [message, setMessage] = useState<MessageState>(null);
  const [loading, setLoading] = useState(false);

  const emailJsConfig = getEmailJsConfig();
  const isConfigured = emailJsConfig.missingKeys.length === 0;
  const protein = Number(form.proteinTarget) || 0;
  const carbs = Number(form.carbsTarget) || 0;
  const fat = Number(form.fatTarget) || 0;
  const calculatedCalories = protein || carbs || fat ? protein * 4 + carbs * 4 + fat * 9 : 0;

  const setField = (field: FieldName, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
    setErrors(current => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setMessage(null);

    const nextErrors = validateConsultationForm(form);
    setErrors(nextErrors);

    if (hasValidationErrors(nextErrors)) {
      setMessage({ text: 'Please fix the highlighted fields before sending your consultation request.', error: true });
      return;
    }

    if (!isConfigured) {
      setMessage({
        text: `EmailJS is missing: ${emailJsConfig.missingKeys.join(', ')}.`,
        error: true,
      });
      return;
    }

    setLoading(true);

    try {
      await emailjs.send(
        emailJsConfig.serviceId,
        emailJsConfig.templateId,
        buildConsultationTemplateParams(form),
        { publicKey: emailJsConfig.publicKey },
      );
      setForm(defaultConsultationFormData);
      setErrors({});
      setMessage({
        text: 'Consultation request sent. We will review your goals and follow up with next steps.',
        error: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Please try again or reach out through Instagram.';
      setMessage({ text: `Could not send your request. ${errorMessage}`, error: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container mx-auto px-6 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-8 lg:gap-12 max-w-6xl mx-auto">
        <aside className="space-y-6">
          <div className="bg-[var(--color-surface-elevated)] rounded-[var(--radius-card)] shadow-[var(--shadow-card)] p-8">
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand)] mb-3">
              Personalized guidance
            </p>
            <h2 className="font-[family-name:var(--font-display)] font-bold text-[32px] text-[var(--color-fg)] leading-tight mb-4">
              Not sure what macros fit your body and goals?
            </h2>
            <p className="text-[15px] text-[var(--color-fg-muted)] leading-relaxed">
              Share your goals, training habits, dietary needs, and where you are with macros. We will use that context to recommend a plan or off-menu prep direction.
            </p>
          </div>

          <div className="bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] p-6">
            <h3 className="font-semibold text-[18px] text-[var(--color-fg)] mb-4">
              Helpful details to include
            </h3>
            <ul className="space-y-3 text-[14px] text-[var(--color-fg-muted)]">
              <li className="flex gap-3">
                <span className="text-[var(--color-brand)] font-bold">1.</span>
                Your primary goal and timeline.
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--color-brand)] font-bold">2.</span>
                Current routine, activity level, and nutrition habits.
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--color-brand)] font-bold">3.</span>
                Allergies, dietary restrictions, and foods you avoid.
              </li>
            </ul>
          </div>
        </aside>

        <div className="bg-[var(--color-surface-elevated)] rounded-[var(--radius-card)] shadow-[var(--shadow-card)] p-6 sm:p-8">
          {!isConfigured && (
            <div className="mb-6 p-4 rounded-[var(--radius-input)] bg-red-50 text-red-700 text-[14px]">
              EmailJS is not configured yet. Add {emailJsConfig.missingKeys.join(', ')} to enable consultation submissions.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="name" className={labelCls}>
                  Name <RequiredMark />
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={event => setField('name', event.target.value)}
                  className={inputCls}
                  placeholder="Your name"
                />
                <FieldError error={errors.name} />
              </div>

              <div>
                <label htmlFor="email" className={labelCls}>
                  Email <RequiredMark />
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={event => setField('email', event.target.value)}
                  className={inputCls}
                  placeholder="you@example.com"
                />
                <FieldError error={errors.email} />
              </div>
            </div>

            <div>
              <label htmlFor="phoneOrInstagram" className={labelCls}>
                Phone or Instagram handle
              </label>
              <input
                id="phoneOrInstagram"
                type="text"
                value={form.phoneOrInstagram}
                onChange={event => setField('phoneOrInstagram', event.target.value)}
                className={inputCls}
                placeholder="@yourhandle or phone number"
              />
              <p className={hintCls}>Optional, but helpful if you prefer follow-up outside email.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="goal" className={labelCls}>
                  Primary goal <RequiredMark />
                </label>
                <select
                  id="goal"
                  required
                  value={form.goal}
                  onChange={event => setField('goal', event.target.value)}
                  className={inputCls}
                >
                  <option value="">Choose a goal</option>
                  {CONSULTATION_GOAL_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <FieldError error={errors.goal} />
              </div>

              <div>
                <label htmlFor="requestType" className={labelCls}>
                  What do you need? <RequiredMark />
                </label>
                <select
                  id="requestType"
                  required
                  value={form.requestType}
                  onChange={event => setField('requestType', event.target.value)}
                  className={inputCls}
                >
                  <option value="">Choose a request</option>
                  {REQUEST_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <FieldError error={errors.requestType} />
              </div>
            </div>

            <div>
              <label htmlFor="macroStatus" className={labelCls}>
                Macro comfort level <RequiredMark />
              </label>
              <select
                id="macroStatus"
                required
                value={form.macroStatus}
                onChange={event => setField('macroStatus', event.target.value)}
                className={inputCls}
              >
                <option value="">Choose one</option>
                {MACRO_STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <FieldError error={errors.macroStatus} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label htmlFor="age" className={labelCls}>Age</label>
                <input
                  id="age"
                  type="number"
                  min="1"
                  value={form.age}
                  onChange={event => setField('age', event.target.value)}
                  className={inputCls}
                  placeholder="32"
                />
              </div>

              <div>
                <label htmlFor="height" className={labelCls}>Height</label>
                <input
                  id="height"
                  type="text"
                  value={form.height}
                  onChange={event => setField('height', event.target.value)}
                  className={inputCls}
                  placeholder="5'10&quot;"
                />
              </div>

              <div>
                <label htmlFor="weight" className={labelCls}>Weight</label>
                <input
                  id="weight"
                  type="text"
                  value={form.weight}
                  onChange={event => setField('weight', event.target.value)}
                  className={inputCls}
                  placeholder="185 lb"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="bodyType" className={labelCls}>Body type</label>
                <select
                  id="bodyType"
                  value={form.bodyType}
                  onChange={event => setField('bodyType', event.target.value)}
                  className={inputCls}
                >
                  <option value="">Choose body type</option>
                  {BODY_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <p className={hintCls}>Optional. Choose unsure if you want us to help classify this.</p>
              </div>

              <div>
                <label htmlFor="activityLevel" className={labelCls}>Activity level</label>
                <select
                  id="activityLevel"
                  value={form.activityLevel}
                  onChange={event => setField('activityLevel', event.target.value)}
                  className={inputCls}
                >
                  <option value="">Choose activity level</option>
                  {ACTIVITY_LEVEL_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-[var(--radius-card)] border border-[var(--color-surface-sunken)] bg-[var(--color-surface-base)] p-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-5">
                <div>
                  <h3 className="font-semibold text-[18px] text-[var(--color-fg)]">Known macro targets</h3>
                  <p className="text-[13px] text-[var(--color-fg-muted)] mt-1">
                    Leave these blank if you need us to calculate them from your goals.
                  </p>
                </div>
                {calculatedCalories > 0 && (
                  <div className="rounded-[var(--radius-pill)] bg-[var(--color-brand-soft)] px-4 py-2 text-[13px] font-semibold text-[var(--color-brand)]">
                    Estimated {calculatedCalories} calories
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="proteinTarget" className={labelCls}>Protein (g)</label>
                  <input
                    id="proteinTarget"
                    type="number"
                    min="0"
                    value={form.proteinTarget}
                    onChange={event => setField('proteinTarget', event.target.value)}
                    className={inputCls}
                    placeholder="180"
                  />
                </div>

                <div>
                  <label htmlFor="carbsTarget" className={labelCls}>Carbs (g)</label>
                  <input
                    id="carbsTarget"
                    type="number"
                    min="0"
                    value={form.carbsTarget}
                    onChange={event => setField('carbsTarget', event.target.value)}
                    className={inputCls}
                    placeholder="160"
                  />
                </div>

                <div>
                  <label htmlFor="fatTarget" className={labelCls}>Fat (g)</label>
                  <input
                    id="fatTarget"
                    type="number"
                    min="0"
                    value={form.fatTarget}
                    onChange={event => setField('fatTarget', event.target.value)}
                    className={inputCls}
                    placeholder="60"
                  />
                </div>

                <div>
                  <label htmlFor="calorieTarget" className={labelCls}>Calories</label>
                  <input
                    id="calorieTarget"
                    type="number"
                    min="0"
                    value={form.calorieTarget}
                    onChange={event => setField('calorieTarget', event.target.value)}
                    className={inputCls}
                    placeholder={calculatedCalories > 0 ? String(calculatedCalories) : '2200'}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="dietaryRestrictions" className={labelCls}>Dietary restrictions</label>
                <textarea
                  id="dietaryRestrictions"
                  value={form.dietaryRestrictions}
                  onChange={event => setField('dietaryRestrictions', event.target.value)}
                  rows={3}
                  className={`${inputCls} resize-none`}
                  placeholder="Low sodium, gluten free, no pork..."
                />
              </div>

              <div>
                <label htmlFor="allergies" className={labelCls}>Allergies</label>
                <textarea
                  id="allergies"
                  value={form.allergies}
                  onChange={event => setField('allergies', event.target.value)}
                  rows={3}
                  className={`${inputCls} resize-none`}
                  placeholder="Shellfish, nuts, dairy..."
                />
              </div>
            </div>

            <div>
              <label htmlFor="healthConsiderations" className={labelCls}>Health considerations</label>
              <textarea
                id="healthConsiderations"
                value={form.healthConsiderations}
                onChange={event => setField('healthConsiderations', event.target.value)}
                rows={3}
                className={`${inputCls} resize-none`}
                placeholder="Anything we should consider when recommending macros or meal structure."
              />
            </div>

            <div>
              <label htmlFor="message" className={labelCls}>
                What do you want help with? <RequiredMark />
              </label>
              <textarea
                id="message"
                required
                value={form.message}
                onChange={event => setField('message', event.target.value)}
                rows={5}
                className={`${inputCls} resize-none`}
                placeholder="Tell us about your goals, current meals, preferences, timeline, and what kind of plan you are hoping for."
              />
              <FieldError error={errors.message} />
            </div>

            {message && (
              <div className={`p-4 rounded-[var(--radius-input)] text-[14px] ${message.error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-[var(--radius-pill)] font-semibold text-[16px] transition-colors flex items-center justify-center ${
                loading
                  ? 'bg-[var(--color-surface-sunken)] text-[var(--color-fg-subtle)]'
                  : 'bg-[var(--color-brand)] text-[var(--color-surface-elevated)] hover:bg-[var(--color-brand-hover)]'
              }`}
            >
              {loading ? 'Sending request...' : 'Request Consultation'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
