import React, { createContext, useEffect, useState } from "react";

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
	const [theme, setTheme] = useState(() => {
		try {
			return localStorage.getItem("theme") ?? "light";
		} catch {
			return "light";
		}
	});

	useEffect(() => {
		document.documentElement.setAttribute('data-theme', theme);
		document.body.setAttribute('data-theme', theme);
		document.documentElement.classList.toggle('dark', theme === 'dark');
		document.documentElement.classList.toggle('light', theme === 'light');
		document.body.classList.toggle('dark', theme === 'dark');
		document.body.classList.toggle('light', theme === 'light');
		try {
			localStorage.setItem("theme", theme);
		} catch {}
	}, [theme]);

	const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export default ThemeProvider;