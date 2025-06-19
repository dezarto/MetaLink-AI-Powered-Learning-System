import React, { createContext, useContext, useState, useEffect } from 'react';

const PerspectiveContext = createContext();

export const PerspectiveProvider = ({ children }) => {
    const [isChildPerspective, setIsChildPerspective] = useState(() => {
        const savedPerspective = sessionStorage.getItem('isChildPerspective');
        return savedPerspective ? JSON.parse(savedPerspective) : false;
    });

    useEffect(() => {
        sessionStorage.setItem('isChildPerspective', JSON.stringify(isChildPerspective));
    }, [isChildPerspective]);

    const togglePerspective = () => {
        setIsChildPerspective(prev => !prev);
    };

    const resetPerspective = () => {
        setIsChildPerspective(false);
        sessionStorage.removeItem('isChildPerspective');
    };

    return (
        <PerspectiveContext.Provider value={{ isChildPerspective, togglePerspective, resetPerspective }}>
            {children}
        </PerspectiveContext.Provider>
    );
};

export const usePerspective = () => {
    const context = useContext(PerspectiveContext);
    if (!context) {
        throw new Error('usePerspective must be used within a PerspectiveProvider');
    }
    return context;
};