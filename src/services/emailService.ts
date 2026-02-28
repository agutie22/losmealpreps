import emailjs from '@emailjs/browser';

interface ConsultationData {
    name: string;
    email: string;
    phone: string;
    notes: string;
    goals: {
        protein: number;
        carbs: number;
        fats: number;
        calories: number;
    };
    preferences: {
        restrictions: string[];
    };
}

export const sendConsultationRequest = async (data: ConsultationData): Promise<boolean> => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    // Check if keys are configured
    if (!serviceId || !templateId || !publicKey) {
        throw new Error('EmailJS configuration is missing. Please check your .env file.');
    }

    try {
        const templateParams = {
            from_name: data.name,
            from_email: data.email,
            phone: data.phone,
            message: data.notes,
            goals_summary: `Protein: ${data.goals.protein}g, Carbs: ${data.goals.carbs}g, Fats: ${data.goals.fats}g (${data.goals.calories} kcal)`,
            preferences: data.preferences.restrictions.join(', ') || 'None',
        };

        await emailjs.send(serviceId, templateId, templateParams, publicKey);
        return true;
    } catch (error) {
        console.error('Failed to send email:', error);
        return false;
    }
};
