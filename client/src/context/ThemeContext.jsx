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
		document.body.className = theme;
		document.body.setAttribute('data-theme', theme);
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