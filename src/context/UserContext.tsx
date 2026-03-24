import { createContext, useContext, useState, type ReactNode } from 'react';

export interface MacroGoals {
    protein: number;
    carbs: number;
    fats: number;
    calories: number;
}

export interface DietaryPreferences {
    portionSize: '6oz' | '8oz';
    allergies: string; // Comma separated string for simplicity in UI
    restrictions: string[]; // ['Gluten-Free', 'Keto', etc.]
}

interface UserContextType {
    isFirstTimeCustomer: boolean;
    toggleCustomerStatus: () => void;
    macroGoals: MacroGoals;
    updateMacroGoals: (goals: Partial<MacroGoals>) => void;
    dietaryPreferences: DietaryPreferences;
    updateDietaryPreferences: (prefs: Partial<DietaryPreferences>) => void;
    isSubscriber: boolean;
    toggleSubscription: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [isFirstTimeCustomer, setIsFirstTimeCustomer] = useState(true);
    const [isSubscriber, setIsSubscriber] = useState(true); // Default to subscriber for better pricing display
    const [macroGoals, setMacroGoals] = useState<MacroGoals>({
        protein: 150,
        carbs: 200,
        fats: 60,
        calories: 1940
    });

    const [dietaryPreferences, setDietaryPreferences] = useState<DietaryPreferences>({
        portionSize: '6oz',
        allergies: '',
        restrictions: []
    });

    const toggleCustomerStatus = () => {
        setIsFirstTimeCustomer(prev => !prev);
    };

    const toggleSubscription = () => {
        setIsSubscriber(prev => !prev);
    };

    const updateDietaryPreferences = (newPrefs: Partial<DietaryPreferences>) => {
        setDietaryPreferences(prev => ({ ...prev, ...newPrefs }));
    };

    const updateMacroGoals = (newGoals: Partial<MacroGoals>) => {
        setMacroGoals(prev => {
            const updated = { ...prev, ...newGoals };
            if (!newGoals.calories) {
                updated.calories = (updated.protein * 4) + (updated.carbs * 4) + (updated.fats * 9);
            }
            return updated;
        });
    };

    return (
        <UserContext.Provider value={{
            isFirstTimeCustomer,
            toggleCustomerStatus,
            macroGoals,
            updateMacroGoals,
            dietaryPreferences,
            updateDietaryPreferences,
            isSubscriber,
            toggleSubscription
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
